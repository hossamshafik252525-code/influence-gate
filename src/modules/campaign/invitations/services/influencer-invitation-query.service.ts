import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { Campaign } from '../../entities/campaign.entity';
import { CampaignStatus } from '../../enums';
import { InvitationStatus } from '../enums';
import { GetInfluencerInvitationsQueryDto } from '../dto';
import { PaginatedResult } from '../../../../common/interfaces';

@Injectable()
export class InfluencerInvitationQueryService {
  constructor(
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepository: Repository<CampaignInvitedInfluencer>,
  ) {}

  async getInvitations(
    userId: string,
    query: GetInfluencerInvitationsQueryDto,
  ): Promise<PaginatedResult<CampaignInvitedInfluencer>> {
    await this.cancelExpiredInvitationsForInfluencer(userId);

    const qb = this.invitationRepository
      .createQueryBuilder('inv')
      .innerJoinAndSelect('inv.campaign', 'campaign')
      .where('inv.influencerId = :userId', { userId })
      .andWhere('inv.status IN (:...invStatuses)', {
        invStatuses: [InvitationStatus.PENDING, InvitationStatus.CANCELLED],
      })
      .andWhere('campaign.status = :campaignStatus', { campaignStatus: CampaignStatus.IMPLEMENTATION });

    this.applyCommonFilters(qb, query);

    qb.orderBy('inv.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  async cancelExpiredInvitationsForInfluencer(userId: string): Promise<void> {
    await this.invitationRepository.query(
      `UPDATE campaign_invited_influencers AS inv
       SET status = $2, "updatedAt" = NOW()
       FROM campaigns AS c
       WHERE inv."campaignId" = c.id
         AND inv."influencerId" = $1
         AND inv.status = $3
         AND c.status = $4
         AND c."implementationStartDate" IS NOT NULL
         AND c."implementationEndDate" IS NOT NULL
         AND EXTRACT(EPOCH FROM (NOW() - c."implementationStartDate"::timestamp))
             >= 0.75 * EXTRACT(EPOCH FROM (c."implementationEndDate"::timestamp - c."implementationStartDate"::timestamp))`,
      [
        userId,
        InvitationStatus.CANCELLED,
        InvitationStatus.PENDING,
        CampaignStatus.IMPLEMENTATION,
      ],
    );
  }

  private applyCommonFilters(
    qb: SelectQueryBuilder<CampaignInvitedInfluencer>,
    query: GetInfluencerInvitationsQueryDto,
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
      qb.andWhere('campaign.categoryIds @> :categoryId', {
        categoryId: JSON.stringify([query.categoryId]),
      });
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
  }
}
