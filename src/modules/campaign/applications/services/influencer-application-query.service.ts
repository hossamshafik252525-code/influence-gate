import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { GetInfluencerApplicationsQueryDto } from '../dto';
import { PaginatedResult } from '../../../../common/interfaces';

@Injectable()
export class InfluencerApplicationQueryService {
  constructor(
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
  ) {}

  async getApplications(
    userId: string,
    query: GetInfluencerApplicationsQueryDto,
  ): Promise<PaginatedResult<CampaignApplication>> {
    const qb = this.applicationRepository
      .createQueryBuilder('app')
      .innerJoinAndSelect('app.campaign', 'campaign')
      .where('app.influencerId = :userId', { userId });

    this.applyCommonFilters(qb, query);

    qb.orderBy('app.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  private applyCommonFilters(
    qb: SelectQueryBuilder<CampaignApplication>,
    query: GetInfluencerApplicationsQueryDto,
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
}
