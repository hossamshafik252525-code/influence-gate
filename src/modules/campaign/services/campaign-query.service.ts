import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../submissions/entities/campaign-submission.entity';
import { InfluencerProfileQueryService } from '../../influencer/profile/services/influencer-profile-query.service';
import {
  CampaignStatus,
  CampaignVisibility,
  MyCampaignsStatusFilter,
} from '../enums';
import { ApplicationStatus } from '../applications/enums';
import { InvitationStatus } from '../invitations/enums';
import { myCampaignsFilterToStatuses } from '../utils';
import { CampaignValidationService } from './campaign-validation.service';
import {
  GetAdvertiserMyCampaignsQueryDto,
  GetNewCampaignsQueryDto,
  GetInfluencerMyCampaignsQueryDto,
} from '../dto';
import { PaginatedResult } from '../../../common/interfaces';
import { CampaignDetailRawResult } from '../interfaces/influencer-campaign.interface';

@Injectable()
export class CampaignQueryService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepository: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepository: Repository<CampaignSubmission>,
    private readonly campaignValidationService: CampaignValidationService,
    private readonly influencerProfileQueryService: InfluencerProfileQueryService,
  ) {}

  async getAdvertiserCampaigns(
    advertiserId: string,
    query: GetAdvertiserMyCampaignsQueryDto,
  ): Promise<{ campaigns: Campaign[]; total: number }> {
    const qb = this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.advertiserId = :advertiserId', { advertiserId });

    if (query.statuses?.length) {
      qb.andWhere('campaign.status IN (:...statuses)', {
        statuses: query.statuses,
      });
    }

    if (query.categoryIds?.length) {
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from('campaign_categories', 'cc')
          .where('cc."campaignId" = campaign.id')
          .andWhere('cc."categoryId" IN (:...filterCategoryIds)')
          .getQuery();
        return `EXISTS ${sub}`;
      });
      qb.setParameter('filterCategoryIds', query.categoryIds);
    }

    if (query.platforms?.length) {
      qb.andWhere('campaign.includedPlatforms && :platforms::jsonb', {
        platforms: JSON.stringify(query.platforms),
      });
    }

    if (query.contentTypes?.length) {
      qb.andWhere('campaign.contentTypes && :contentTypes::jsonb', {
        contentTypes: JSON.stringify(query.contentTypes),
      });
    }

    if (query.budgetFrom !== undefined) {
      qb.andWhere('campaign.budget >= :budgetFrom', {
        budgetFrom: query.budgetFrom,
      });
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
        qb.andWhere('LOWER(campaign.name) LIKE LOWER(:search)', {
          search: `%${trimmed}%`,
        });
      }
    }

    qb.orderBy('campaign.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [paged, total] = await qb.getManyAndCount();

    if (paged.length === 0) {
      return { campaigns: [], total };
    }

    const ids = paged.map((c) => c.id);
    const campaigns = await this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.categories', 'category')
      .where('campaign.id IN (:...ids)', { ids })
      .orderBy('campaign.createdAt', 'DESC')
      .getMany();

    return { campaigns, total };
  }

  async getCampaignById(
    campaignId: string,
    advertiserId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
      relations: [
        'categories',
        'advertiser',
        'invitedInfluencers',
        'invitedInfluencers.influencer',
        'invitedInfluencers.influencer.influencerProfile',
      ],
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    return campaign;
  }

  async findDraftOrFail(
    campaignId: string,
    advertiserId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId, status: CampaignStatus.DRAFT },
    });

    if (!campaign) {
      throw new NotFoundException('المسودة غير موجودة');
    }

    return campaign;
  }

  async findCampaignWithRelations(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: [
        'categories',
        'invitedInfluencers',
        'invitedInfluencers.influencer',
        'invitedInfluencers.influencer.influencerProfile',
      ],
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    return campaign;
  }

  async getNewCampaigns(
    userId: string,
    query: GetNewCampaignsQueryDto,
  ): Promise<PaginatedResult<Campaign>> {
    const { contentTypes, platforms, categoryIds } =
      await this.influencerProfileQueryService.loadInfluencerMatchSignals(
        userId,
      );

    const qb = this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.status IN (:...statuses)', {
        statuses: [CampaignStatus.APPROVED, CampaignStatus.PENDING_MINIMUM],
      })
      .andWhere('campaign.campaignVisibility = :visibility', {
        visibility: CampaignVisibility.PUBLIC,
      })
      .andWhere(
        '(campaign.applicationDeadlineDate >= CURRENT_DATE OR campaign.status = :pendingMinimum)',
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

    this.applyCommonInfluencerFilters(qb, query);
    this.applyInfluencerListFields(qb);
    this.applyMatchOrdering(qb, contentTypes, platforms, categoryIds);

    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  async getInfluencerCampaigns(
    userId: string,
    query: GetInfluencerMyCampaignsQueryDto,
  ): Promise<PaginatedResult<Campaign>> {
    const campaignStatuses = myCampaignsFilterToStatuses(query.status);

    const qb = this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.status IN (:...statuses)', {
        statuses: campaignStatuses,
      });

    this.applyMembershipFilter(qb, userId, query.status);
    this.applyCommonInfluencerFilters(qb, query);
    this.applyInfluencerListFields(qb);

    qb.orderBy('campaign.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  async getCampaignDetail(
    campaignId: string,
    userId: string,
  ): Promise<CampaignDetailRawResult> {
    const campaign =
      await this.campaignValidationService.assertCampaignExists(campaignId);
    await this.campaignValidationService.assertInfluencerCanAccessCampaign(
      campaign,
      userId,
    );

    const [application, submission, invitation] = await Promise.all([
      this.applicationRepository.findOne({
        where: { campaignId, influencerId: userId },
      }),
      this.submissionRepository.findOne({
        where: { campaignId, influencerId: userId },
      }),
      campaign.campaignVisibility === CampaignVisibility.PRIVATE
        ? this.invitationRepository.findOne({
            where: { campaignId, influencerId: userId },
            relations: ['influencer', 'influencer.influencerProfile'],
          })
        : Promise.resolve(null),
    ]);

    return {
      campaign,
      application: application ?? null,
      submission: submission ?? null,
      invitation: invitation ?? null,
    };
  }


  private applyInfluencerListFields(qb: SelectQueryBuilder<Campaign>): void {
    qb.select([
      'campaign.id',
      'campaign.campaignNumber',
      'campaign.name',
      'campaign.description',
      'campaign.status',
      'campaign.startDate',
      'campaign.endDate',
      'campaign.applicationDeadlineDate',
      'campaign.pendingMinimumDeadline',
      'campaign.includedPlatforms',
      'campaign.contentTypes',
      'campaign.createdAt',
    ]);
  }

  private applyCommonInfluencerFilters(
    qb: SelectQueryBuilder<Campaign>,
    query: GetNewCampaignsQueryDto | GetInfluencerMyCampaignsQueryDto,
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
        qb.andWhere('LOWER(campaign.name) LIKE LOWER(:search)', {
          search: `%${trimmed}%`,
        });
      }
    }

    if (query.categoryId) {
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from('campaign_categories', 'cc')
          .where('cc."campaignId" = campaign.id')
          .andWhere('cc."categoryId" = :filterCategoryId')
          .getQuery();
        return `EXISTS ${sub}`;
      });
      qb.setParameter('filterCategoryId', query.categoryId);
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

    qb.andWhere(
      `(${acceptedApplicationExists} OR ${acceptedInvitationExists})`,
    );
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
        `CASE WHEN EXISTS (
          SELECT 1 FROM campaign_categories cc_match
          WHERE cc_match."campaignId" = campaign.id
            AND cc_match."categoryId" = ANY(:matchCategoryIds)
        ) THEN 1 ELSE 0 END`,
      );
      qb.setParameter('matchCategoryIds', categoryIds);
    }

    if (parts.length) {
      qb.addOrderBy(`(${parts.join(' + ')})`, 'DESC');
    }

    qb.addOrderBy('campaign.createdAt', 'DESC');
  }
}
