import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignStatus, CampaignVisibility, ApplicationStatus } from '../enums';
import { GetInfluencerCampaignsQueryDto } from '../dto/get-influencer-campaigns-query.dto';
import {
  InfluencerCampaignListItem,
  InfluencerCampaignDetail,
  InfluencerCampaignsResult,
} from '../interfaces/influencer-campaign.interface';

@Injectable()
export class InfluencerCampaignQueryService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
  ) {}

  async getCampaigns(
    userId: string,
    query: GetInfluencerCampaignsQueryDto,
  ): Promise<InfluencerCampaignsResult> {
    if (query.type === 'new') {
      return this.getNewCampaigns(userId, query);
    }
    return this.getMyCampaigns(userId, query);
  }

  async getCampaignDetail(campaignId: string, userId: string): Promise<InfluencerCampaignDetail> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
      relations: ['category'],
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (campaign.campaignVisibility !== CampaignVisibility.PUBLIC) {
      const hasAccess = await this.hasAccessToPrivateCampaign(campaignId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('لا يمكنك الوصول لهذه الحملة');
      }
    }

    const application = await this.applicationRepo.findOne({
      where: { campaignId, influencerId: userId },
    });

    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      name: campaign.name,
      description: campaign.description,
      category: campaign.category
        ? { id: campaign.category.id, name: campaign.category.name }
        : null,
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
      contentDescription: campaign.contentDescription,
      implementationType: campaign.implementationType,
      implementationPeriodDays: campaign.implementationPeriodDays,
      deadlineDate: campaign.deadlineDate,
      influencerPrice: Number(campaign.influencerPrice),
      requiredInfluencersCount: campaign.requiredInfluencersCount,
      influencerType: campaign.influencerType,
      hasApplied: !!application,
    };
  }

  private async getNewCampaigns(
    userId: string,
    query: GetInfluencerCampaignsQueryDto,
  ): Promise<InfluencerCampaignsResult> {
    const qb = this.campaignRepo
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.category', 'category')
      .where('campaign.status IN (:...statuses)', {
        statuses: [CampaignStatus.APPROVED, CampaignStatus.PENDING_MINIMUM],
      })
      .andWhere('campaign.campaignVisibility = :visibility', {
        visibility: CampaignVisibility.PUBLIC,
      })
      .andWhere(
        '(campaign.deadlineDate >= CURRENT_DATE OR campaign.status = :pendingMinimum)',
        { pendingMinimum: CampaignStatus.PENDING_MINIMUM },
      );

    this.applyCommonFilters(qb, query);

    qb.select([
      'campaign.id',
      'campaign.campaignNumber',
      'campaign.name',
      'campaign.description',
      'campaign.deadlineDate',
      'campaign.includedPlatforms',
      'campaign.contentTypes',
      'campaign.influencerPrice',
      'campaign.createdAt',
    ]);

    qb.orderBy('campaign.createdAt', 'DESC');
    qb.skip((query.page - 1) * query.limit);
    qb.take(query.limit);

    const [campaigns, total] = await qb.getManyAndCount();

    return {
      data: campaigns.map((c) => this.mapToListItem(c)),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  private async getMyCampaigns(
    userId: string,
    query: GetInfluencerCampaignsQueryDto,
  ): Promise<InfluencerCampaignsResult> {
    const qb = this.campaignRepo
      .createQueryBuilder('campaign')
      .innerJoin(
        'campaign.applications',
        'app',
        'app.influencerId = :userId AND app.status = :accepted',
        { userId, accepted: ApplicationStatus.ACCEPTED },
      )
      .leftJoinAndSelect('campaign.category', 'category');

    if (query.status) {
      qb.andWhere('campaign.status = :status', { status: query.status });
    }

    this.applyCommonFilters(qb, query);

    qb.select([
      'campaign.id',
      'campaign.campaignNumber',
      'campaign.name',
      'campaign.description',
      'campaign.deadlineDate',
      'campaign.includedPlatforms',
      'campaign.contentTypes',
      'campaign.influencerPrice',
      'campaign.createdAt',
    ]);

    qb.orderBy('campaign.createdAt', 'DESC');
    qb.skip((query.page - 1) * query.limit);
    qb.take(query.limit);

    const [campaigns, total] = await qb.getManyAndCount();

    return {
      data: campaigns.map((c) => this.mapToListItem(c)),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  private applyCommonFilters(
    qb: ReturnType<Repository<Campaign>['createQueryBuilder']>,
    query: GetInfluencerCampaignsQueryDto,
  ): void {
    if (query.search) {
      const trimmed = query.search.trim();
      const isNumeric = /^\d+$/.test(trimmed);
      if (isNumeric) {
        qb.andWhere(
          '(LOWER(campaign.name) LIKE LOWER(:search) OR campaign.campaignNumber = :num)',
          { search: `%${trimmed}%`, num: parseInt(trimmed, 10) },
        );
      } else {
        qb.andWhere('LOWER(campaign.name) LIKE LOWER(:search)', { search: `%${trimmed}%` });
      }
    }

    if (query.categoryId) {
      qb.andWhere('campaign.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.platform) {
      qb.andWhere('campaign.includedPlatforms @> :platform', {
        platform: JSON.stringify([query.platform]),
      });
    }

    if (query.contentType) {
      qb.andWhere('campaign.contentTypes @> :contentType', {
        contentType: JSON.stringify([query.contentType]),
      });
    }

    if (query.implementationType) {
      qb.andWhere('campaign.implementationType = :implementationType', {
        implementationType: query.implementationType,
      });
    }

    if (query.implementationPeriodDays !== undefined) {
      qb.andWhere('campaign.implementationPeriodDays = :days', {
        days: query.implementationPeriodDays,
      });
    }

    if (query.priceFrom !== undefined) {
      qb.andWhere('campaign.influencerPrice >= :priceFrom', { priceFrom: query.priceFrom });
    }

    if (query.priceTo !== undefined) {
      qb.andWhere('campaign.influencerPrice <= :priceTo', { priceTo: query.priceTo });
    }
  }

  private mapToListItem(campaign: Campaign): InfluencerCampaignListItem {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      name: campaign.name,
      description: campaign.description,
      deadlineDate: campaign.deadlineDate,
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
      influencerPrice: Number(campaign.influencerPrice),
    };
  }

  private async hasAccessToPrivateCampaign(
    campaignId: string,
    userId: string,
  ): Promise<boolean> {
    const application = await this.applicationRepo.findOne({
      where: { campaignId, influencerId: userId },
    });

    if (application) {
      return true;
    }

    const invited = await this.campaignRepo
      .createQueryBuilder('campaign')
      .innerJoin('campaign.invitedInfluencers', 'invited', 'invited.influencerId = :userId', {
        userId,
      })
      .where('campaign.id = :campaignId', { campaignId })
      .getCount();

    return invited > 0;
  }
}
