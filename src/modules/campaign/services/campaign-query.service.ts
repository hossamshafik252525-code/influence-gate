import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignStatus } from '../enums';
import { ApplicationStatus } from '../applications/enums';
import { GetMyCampaignsQueryDto } from '../dto/get-my-campaigns-query.dto';
import { PaginatedResult } from '../../../common/interfaces';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import { GetApplicationsResult, CampaignApplicationItem } from '../applications/interfaces';

export interface CampaignStatistics {
  totalCampaigns: number;
  completedCampaigns: number;
  discardedCampaigns: number;
  totalSpent: number;
}

export interface GetMyCampaignsResult extends PaginatedResult<Campaign> {
  statistics: CampaignStatistics;
}

@Injectable()
export class CampaignQueryService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepository: Repository<InfluencerProfile>,
  ) {}

  async getMyCampaigns(
    advertiserId: string,
    query: GetMyCampaignsQueryDto,
  ): Promise<GetMyCampaignsResult> {
    const qb = this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.category', 'category')
      .where('campaign.advertiserId = :advertiserId', { advertiserId });

    if (query.status) {
      qb.andWhere('campaign.status = :status', { status: query.status });
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

    if (query.budgetFrom !== undefined) {
      qb.andWhere('campaign.budget >= :budgetFrom', { budgetFrom: query.budgetFrom });
    }

    if (query.budgetTo !== undefined) {
      qb.andWhere('campaign.budget <= :budgetTo', { budgetTo: query.budgetTo });
    }

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

    qb.select([
      'campaign.id',
      'campaign.campaignNumber',
      'campaign.name',
      'campaign.includedPlatforms',
      'campaign.deadlineDate',
      'campaign.implementationStartDate',
      'campaign.implementationEndDate',
      'campaign.status',
      'campaign.currentStep',
      'campaign.budget',
      'campaign.createdAt',
      'category.id',
      'category.name',
      'category.iconUrl',
    ]);

    qb.orderBy('campaign.createdAt', 'DESC');
    qb.skip((query.page - 1) * query.limit);
    qb.take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    const statistics = await this.getStatistics(advertiserId);

    return {
      data,
      pagination: { total, page: query.page, limit: query.limit },
      statistics,
    };
  }

  async getCampaignById(campaignId: string, advertiserId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
      relations: [
        'category',
        'advertiser',
        'invitedInfluencers',
        'invitedInfluencers.influencer',
      ],
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    return campaign;
  }

  async getCampaignApplications(
    campaignId: string,
    advertiserId: string,
    page: number,
    limit: number,
  ): Promise<GetApplicationsResult> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    const eligibleStatuses: CampaignStatus[] = [
      CampaignStatus.APPROVED,
      CampaignStatus.PENDING_MINIMUM,
    ];

    if (!eligibleStatuses.includes(campaign.status)) {
      throw new BadRequestException('لا يمكن عرض الطلبات في هذه المرحلة');
    }

    const [applications, total] = await this.applicationRepository.findAndCount({
      where: {
        campaignId,
        status: Not(ApplicationStatus.PENDING_ADMIN_APPROVAL),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const influencerIds = applications.map((a) => a.influencerId);

    const profiles = influencerIds.length
      ? await this.influencerProfileRepository
          .createQueryBuilder('ip')
          .leftJoin('ip.user', 'user')
          .select(['ip.userId', 'ip.rating', 'ip.ratingCount', 'user.fullName'])
          .where('ip.userId IN (:...ids)', { ids: influencerIds })
          .getMany()
      : [];

    const completedCounts = await this.applicationRepository
      .createQueryBuilder('app')
      .innerJoin('app.campaign', 'campaign')
      .select('app.influencerId', 'influencerId')
      .addSelect('COUNT(*)', 'count')
      .where('app.influencerId IN (:...ids)', { ids: influencerIds.length ? influencerIds : [''] })
      .andWhere('app.status = :status', { status: ApplicationStatus.ACCEPTED })
      .andWhere('campaign.status = :campaignStatus', { campaignStatus: CampaignStatus.COMPLETED })
      .groupBy('app.influencerId')
      .getRawMany<{ influencerId: string; count: string }>();

    const profileMap = new Map(profiles.map((p) => [p.userId, { rating: p.rating, ratingCount: p.ratingCount, fullName: p.user?.fullName ?? '' }]));
    const countMap = new Map(completedCounts.map((r) => [r.influencerId, Number(r.count)]));

    const data: CampaignApplicationItem[] = applications.map((app) => ({
      id: app.id,
      campaignId: app.campaignId,
      influencerId: app.influencerId,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      influencer: {
        fullName: profileMap.get(app.influencerId)?.fullName ?? '',
        rating: Number(profileMap.get(app.influencerId)?.rating ?? 0),
        ratingCount: profileMap.get(app.influencerId)?.ratingCount ?? 0,
        completedCampaignsCount: countMap.get(app.influencerId) ?? 0,
      },
    }));

    return { data, pagination: { total, page, limit } };
  }

  private async getStatistics(advertiserId: string): Promise<CampaignStatistics> {
    const totalCampaigns = await this.campaignRepository.count({
      where: { advertiserId },
    });

    const completedCampaigns = await this.campaignRepository.count({
      where: { advertiserId, status: CampaignStatus.COMPLETED },
    });

    const discardedCampaigns = await this.campaignRepository.count({
      where: { advertiserId, status: CampaignStatus.DISCARDED },
    });

    const spentResult = await this.campaignRepository
      .createQueryBuilder('campaign')
      .select('COALESCE(SUM(campaign.budget), 0)', 'totalSpent')
      .where('campaign.advertiserId = :advertiserId', { advertiserId })
      .andWhere('campaign.status IN (:...statuses)', {
        statuses: [CampaignStatus.IMPLEMENTATION, CampaignStatus.COMPLETED],
      })
      .getRawOne();

    return {
      totalCampaigns,
      completedCampaigns,
      discardedCampaigns,
      totalSpent: Number(spentResult.totalSpent),
    };
  }
}
