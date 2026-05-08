import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import {
  CampaignStatus,
  CampaignVisibility,
  ApplicationStatus,
  InvitationStatus,
  MyCampaignsStatusFilter,
} from '../enums';
import { CampaignListItemMapper, CampaignDetailMapper } from '../mappers';
import { myCampaignsFilterToStatuses } from '../utils';
import {
  GetNewCampaignsQueryDto,
  GetInfluencerMyCampaignsQueryDto,
  GetInfluencerApplicationsQueryDto,
  GetInfluencerInvitationsQueryDto,
} from '../dto';
import {
  GetNewCampaignsResult,
  GetMyCampaignsResult,
  GetInfluencerApplicationsResult,
  GetInfluencerInvitationsResult,
  CampaignDetailResult,
} from '../interfaces/influencer-campaign.interface';

@Injectable()
export class InfluencerCampaignQueryService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepo: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepo: Repository<CampaignSubmission>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
  ) {}

  async getNewCampaigns(
    userId: string,
    query: GetNewCampaignsQueryDto,
  ): Promise<GetNewCampaignsResult> {
    const { contentTypes, platforms, categoryIds } = await this.loadInfluencerMatchSignals(userId);

    const qb = this.campaignRepo
      .createQueryBuilder('campaign')
      .where('campaign.status IN (:...statuses)', {
        statuses: [CampaignStatus.APPROVED, CampaignStatus.PENDING_MINIMUM],
      })
      .andWhere('campaign.campaignVisibility = :visibility', {
        visibility: CampaignVisibility.PUBLIC,
      })
      .andWhere(
        '(campaign.deadlineDate >= CURRENT_DATE OR campaign.status = :pendingMinimum)',
        { pendingMinimum: CampaignStatus.PENDING_MINIMUM },
      )
      .andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from(CampaignApplication, 'app_sub')
          .where('app_sub.campaignId = campaign.id')
          .andWhere('app_sub.influencerId = :userId')
          .getQuery();
        return `NOT EXISTS ${sub}`;
      })
      .setParameter('userId', userId);

    this.applyCommonFilters(qb, query);
    this.selectCampaignListFields(qb);
    this.applyMatchOrdering(qb, contentTypes, platforms, categoryIds);

    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [campaigns, total] = await qb.getManyAndCount();

    return {
      data: campaigns.map((c) => CampaignListItemMapper.toNew(c)),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  async getMyCampaigns(
    userId: string,
    query: GetInfluencerMyCampaignsQueryDto,
  ): Promise<GetMyCampaignsResult> {
    const campaignStatuses = myCampaignsFilterToStatuses(query.status);

    const qb = this.campaignRepo
      .createQueryBuilder('campaign')
      .where('campaign.status IN (:...statuses)', { statuses: campaignStatuses });

    this.applyMembershipFilter(qb, userId, query.status);
    this.applyCommonFilters(qb, query);
    this.selectCampaignListFields(qb);

    qb.orderBy('campaign.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [campaigns, total] = await qb.getManyAndCount();

    return {
      data: campaigns.map((c) => CampaignListItemMapper.toMy(c)),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  async getApplications(
    userId: string,
    query: GetInfluencerApplicationsQueryDto,
  ): Promise<GetInfluencerApplicationsResult> {
    const qb = this.applicationRepo
      .createQueryBuilder('app')
      .innerJoinAndSelect('app.campaign', 'campaign')
      .where('app.influencerId = :userId', { userId });

    this.applyCommonFiltersOnAlias(qb, query);

    qb.orderBy('app.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [applications, total] = await qb.getManyAndCount();

    return {
      data: applications.map((a) => CampaignListItemMapper.toApplicationItem(a, a.campaign)),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  async getInvitations(
    userId: string,
    query: GetInfluencerInvitationsQueryDto,
  ): Promise<GetInfluencerInvitationsResult> {
    const qb = this.invitationRepo
      .createQueryBuilder('inv')
      .innerJoinAndSelect('inv.campaign', 'campaign')
      .where('inv.influencerId = :userId', { userId })
      .andWhere('inv.status = :invStatus', { invStatus: InvitationStatus.PENDING })
      .andWhere('campaign.status = :campaignStatus', { campaignStatus: CampaignStatus.IMPLEMENTATION });

    this.applyCommonFiltersOnAlias(qb, query);

    qb.orderBy('inv.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [invitations, total] = await qb.getManyAndCount();

    return {
      data: invitations.map((inv) =>
        CampaignListItemMapper.toInvitationItem(inv, inv.campaign),
      ),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  async getCampaignDetail(campaignId: string, userId: string): Promise<CampaignDetailResult> {
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

    const [application, submission, invitation] = await Promise.all([
      this.applicationRepo.findOne({ where: { campaignId, influencerId: userId } }),
      this.submissionRepo.findOne({ where: { campaignId, influencerId: userId } }),
      campaign.campaignVisibility === CampaignVisibility.PRIVATE
        ? this.invitationRepo.findOne({
            where: { campaignId, influencerId: userId },
            relations: ['orderedServices', 'orderedServices.service'],
          })
        : Promise.resolve(null),
    ]);

    return CampaignDetailMapper.toDetail(campaign, application, submission, invitation);
  }

  private applyMembershipFilter(
    qb: SelectQueryBuilder<Campaign>,
    userId: string,
    status: MyCampaignsStatusFilter,
  ): void {
    qb.setParameter('userId', userId);

    const acceptedApplicationExists = `EXISTS (
      SELECT 1 FROM campaign_applications app_m
      WHERE app_m."campaignId" = campaign.id
        AND app_m."influencerId" = :userId
        AND app_m.status = :acceptedAppStatus
    )`;
    qb.setParameter('acceptedAppStatus', ApplicationStatus.ACCEPTED);

    if (status === MyCampaignsStatusFilter.APPLICATION_PERIOD) {
      qb.andWhere(acceptedApplicationExists);
      return;
    }

    const acceptedInvitationExists = `EXISTS (
      SELECT 1 FROM campaign_invited_influencers inv_m
      WHERE inv_m."campaignId" = campaign.id
        AND inv_m."influencerId" = :userId
        AND inv_m.status = :acceptedInvStatus
    )`;
    qb.setParameter('acceptedInvStatus', InvitationStatus.ACCEPTED);

    qb.andWhere(`(${acceptedApplicationExists} OR ${acceptedInvitationExists})`);
  }

  private selectCampaignListFields(qb: SelectQueryBuilder<Campaign>): void {
    qb.select([
      'campaign.id',
      'campaign.campaignNumber',
      'campaign.name',
      'campaign.description',
      'campaign.status',
      'campaign.deadlineDate',
      'campaign.pendingMinimumDeadline',
      'campaign.implementationEndDate',
      'campaign.includedPlatforms',
      'campaign.contentTypes',
      'campaign.influencerPrice',
      'campaign.createdAt',
    ]);
  }

  private async loadInfluencerMatchSignals(
    userId: string,
  ): Promise<{ contentTypes: string[]; platforms: string[]; categoryIds: string[] }> {
    const profile = await this.influencerProfileRepo.findOne({
      where: { userId },
      relations: ['services', 'categories'],
    });

    const services = profile?.services ?? [];
    const categories = profile?.categories ?? [];

    return {
      contentTypes: [...new Set(services.map((s) => s.contentType as string))],
      platforms: [...new Set(services.flatMap((s) => s.includedPlatforms as string[]))],
      categoryIds: [...new Set(categories.map((c) => c.categoryId))],
    };
  }

  private applyMatchOrdering(
    qb: SelectQueryBuilder<Campaign>,
    contentTypes: string[],
    platforms: string[],
    categoryIds: string[],
  ): void {
    const parts: string[] = [];

    if (contentTypes.length) {
      parts.push(
        `CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(campaign.contentTypes) AS ct_elem
          WHERE ct_elem = ANY(:matchContentTypes)
        ) THEN 1 ELSE 0 END`,
      );
      qb.setParameter('matchContentTypes', contentTypes);
    }

    if (platforms.length) {
      parts.push(
        `CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(campaign.includedPlatforms) AS pl_elem
          WHERE pl_elem = ANY(:matchPlatforms)
        ) THEN 1 ELSE 0 END`,
      );
      qb.setParameter('matchPlatforms', platforms);
    }

    if (categoryIds.length) {
      parts.push(
        `CASE WHEN campaign.categoryId IN (:...matchCategoryIds) THEN 1 ELSE 0 END`,
      );
      qb.setParameter('matchCategoryIds', categoryIds);
    }

    if (parts.length) {
      qb.addOrderBy(`(${parts.join(' + ')})`, 'DESC');
    }

    qb.addOrderBy('campaign.createdAt', 'DESC');
  }

  private applyCommonFilters(
    qb: SelectQueryBuilder<Campaign>,
    query: GetNewCampaignsQueryDto,
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

  private applyCommonFiltersOnAlias<T>(
    qb: SelectQueryBuilder<T>,
    query: GetNewCampaignsQueryDto,
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

  private async hasAccessToPrivateCampaign(
    campaignId: string,
    userId: string,
  ): Promise<boolean> {
    const invitation = await this.invitationRepo.findOne({
      where: { campaignId, influencerId: userId },
    });

    if (invitation && invitation.status !== InvitationStatus.CANCELLED) {
      return true;
    }

    const application = await this.applicationRepo.findOne({
      where: { campaignId, influencerId: userId },
    });

    return !!application;
  }
}
