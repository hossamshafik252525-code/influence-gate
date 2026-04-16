import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
} from '../enums';
import { CampaignListItemMapper, CampaignDetailMapper } from '../mappers';
import { GetInfluencerCampaignsQueryDto } from '../dto/get-influencer-campaigns-query.dto';
import {
  GetCampaignsResult,
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

  async getCampaigns(
    userId: string,
    query: GetInfluencerCampaignsQueryDto,
  ): Promise<GetCampaignsResult> {
    switch (query.type) {
      case 'new':
        return this.getNewCampaigns(userId, query);
      case 'current':
        return this.getCurrentCampaigns(userId, query);
      case 'applications':
        return this.getApplicationCampaigns(userId, query);
      case 'invitations':
        return this.getInvitationCampaigns(userId, query);
    }
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
            relations: ['orderedServices'],
          })
        : Promise.resolve(null),
    ]);

    return CampaignDetailMapper.toDetail(campaign, application, submission, invitation);
  }

  private async getNewCampaigns(
    userId: string,
    query: GetInfluencerCampaignsQueryDto,
  ): Promise<GetCampaignsResult> {
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

  private async getCurrentCampaigns(
    userId: string,
    query: GetInfluencerCampaignsQueryDto,
  ): Promise<GetCampaignsResult> {
    const qb = this.campaignRepo
      .createQueryBuilder('campaign')
      .innerJoin(
        'campaign.applications',
        'app',
        'app.influencerId = :userId AND app.status = :accepted',
        { userId, accepted: ApplicationStatus.ACCEPTED },
      )
      .where('campaign.status = :status', { status: CampaignStatus.IMPLEMENTATION });

    this.applyCommonFilters(qb, query);
    this.selectCampaignListFields(qb);

    qb.orderBy('campaign.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [campaigns, total] = await qb.getManyAndCount();

    const campaignIds = campaigns.map((c) => c.id);
    const submissions = campaignIds.length
      ? await this.submissionRepo.find({
          where: { campaignId: In(campaignIds), influencerId: userId },
        })
      : [];

    const submissionMap = new Map(submissions.map((s) => [s.campaignId, s]));

    return {
      data: campaigns.map((c) =>
        CampaignListItemMapper.toCurrent(c, submissionMap.get(c.id) ?? null),
      ),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  private async getApplicationCampaigns(
    userId: string,
    query: GetInfluencerCampaignsQueryDto,
  ): Promise<GetCampaignsResult> {
    const [applications, total] = await this.applicationRepo
      .createQueryBuilder('app')
      .innerJoin('app.campaign', 'campaign')
      .where('app.influencerId = :userId', { userId })
      .select([
        'app.id',
        'app.status',
        'app.createdAt',
        'app.campaignId',
      ])
      .orderBy('app.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const campaignIds = applications.map((a) => a.campaignId);
    const campaigns = campaignIds.length
      ? await this.campaignRepo
          .createQueryBuilder('campaign')
          .where('campaign.id IN (:...ids)', { ids: campaignIds })
          .select([
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
          ])
          .getMany()
      : [];

    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

    return {
      data: applications
        .filter((a) => campaignMap.has(a.campaignId))
        .map((a) => CampaignListItemMapper.toApplication(campaignMap.get(a.campaignId)!, a)),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  private async getInvitationCampaigns(
    userId: string,
    query: GetInfluencerCampaignsQueryDto,
  ): Promise<GetCampaignsResult> {
    const qb = this.invitationRepo
      .createQueryBuilder('inv')
      .innerJoinAndSelect('inv.campaign', 'campaign')
      .where('inv.influencerId = :userId', { userId })
      .andWhere('inv.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [InvitationStatus.REJECTED, InvitationStatus.CANCELLED],
      })
      .andWhere('campaign.status IN (:...statuses)', {
        statuses: [
          CampaignStatus.APPROVED,
          CampaignStatus.PENDING_MINIMUM,
          CampaignStatus.IMPLEMENTATION,
        ],
      });

    this.applyCommonFiltersOnAlias(qb, query);

    qb.select([
      'inv.id',
      'inv.status',
      'inv.createdAt',
      'campaign.id',
      'campaign.campaignNumber',
      'campaign.name',
      'campaign.description',
      'campaign.status',
      'campaign.includedPlatforms',
      'campaign.contentTypes',
      'campaign.influencerPrice',
      'campaign.deadlineDate',
      'campaign.pendingMinimumDeadline',
      'campaign.implementationEndDate',
      'campaign.createdAt',
    ]);

    qb.orderBy('inv.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [invitations, total] = await qb.getManyAndCount();

    return {
      data: invitations.map((inv) =>
        CampaignListItemMapper.toInvitation(inv.campaign, inv),
      ),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  private selectCampaignListFields(
    qb: ReturnType<Repository<Campaign>['createQueryBuilder']>,
  ): void {
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
    qb: ReturnType<Repository<Campaign>['createQueryBuilder']>,
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

  private applyCommonFiltersOnAlias(
    qb: ReturnType<Repository<CampaignInvitedInfluencer>['createQueryBuilder']>,
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
