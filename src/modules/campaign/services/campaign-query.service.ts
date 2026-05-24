import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../submissions/entities/campaign-submission.entity';
import { InfluencerProfileQueryService } from '../../influencer/profile/services/influencer-profile-query.service';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { myCampaignsFilterToStatuses } from '../utils';
import { CampaignValidationService } from './campaign-validation.service';
import { CampaignRepository } from '../repositories';
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
    private readonly campaignRepository: CampaignRepository,
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
      .baseQuery()
      .where('campaign.advertiserId = :advertiserId', { advertiserId });

    this.campaignRepository.applyAdvertiserMyCampaignsFilters(qb, query);

    qb.orderBy('campaign.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [paged, total] = await qb.getManyAndCount();

    if (paged.length === 0) {
      return { campaigns: [], total };
    }

    const ids = paged.map((c) => c.id);
    const campaigns =
      await this.campaignRepository.findCampaignsByIdsWithCategories(ids);

    return { campaigns, total };
  }

  async findDraftOrFail(
    campaignId: string,
    advertiserId: string,
  ): Promise<Campaign> {
    const draft = await this.campaignRepository.findOne({
      id: campaignId,
      advertiserId,
      status: CampaignStatus.DRAFT,
    });

    if (!draft) {
      throw new NotFoundException('المسودة غير موجودة');
    }

    return draft;
  }

  async findCampaignWithRelations(
    campaignId: string,
    advertiserId?: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne(
      { id: campaignId, ...(advertiserId ? { advertiserId } : {}) },
      {
        relations: [
          'categories',
          'contentTypes',
          'implementationTypes',
          'platforms',
          'invitedInfluencers',
          'invitedInfluencers.influencer',
          'invitedInfluencers.influencer.influencerProfile',
          'invitedInfluencers.influencer.influencerProfile.contentTypes',
          'invitedInfluencers.influencer.influencerProfile.implementationTypes',
          'invitedInfluencers.influencer.influencerProfile.platforms',
        ],
      },
    );

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    return campaign;
  }

  async getNewCampaigns(
    userId: string,
    query: GetNewCampaignsQueryDto,
  ): Promise<PaginatedResult<Campaign>> {
    const { contentTypeIds, platformIds, categoryIds } =
      await this.influencerProfileQueryService.loadInfluencerMatchSignals(
        userId,
      );

    const qb = this.campaignRepository
      .baseQuery()
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

    this.campaignRepository.applyCommonCampaignFilters(qb, query);
    this.campaignRepository.applyInfluencerListFields(qb);
    this.campaignRepository.applyMatchOrdering(
      qb,
      contentTypeIds,
      platformIds,
      categoryIds,
    );

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
      .baseQuery()
      .where('campaign.status IN (:...statuses)', {
        statuses: campaignStatuses,
      });

    this.campaignRepository.applyMembershipFilter(qb, userId, query.status);
    this.campaignRepository.applyCommonCampaignFilters(qb, query);
    this.campaignRepository.applyInfluencerListFields(qb);

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
}
