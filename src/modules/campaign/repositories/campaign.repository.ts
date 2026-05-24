import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { ApplicationStatus } from '../applications/enums';
import { InvitationStatus } from '../invitations/enums';
import {
  CampaignStatus,
  CampaignVisibility,
  MyCampaignsStatusFilter,
} from '../enums';
import { GetAdvertiserMyCampaignsQueryDto } from '../dto';

export interface CampaignCommonFilterInput {
  search?: string;
  categoryId?: string;
  platform?: string;
  contentTypeIds?: string[];
  implementationTypeIds?: string[];
}

export interface CampaignFindFilters {
  id?: string;
  ids?: string[];
  advertiserId?: string;
  status?: CampaignStatus;
  statuses?: CampaignStatus[];
  visibility?: CampaignVisibility;
}

export interface CampaignFindOptions {
  relations?: string[];
}

@Injectable()
export class CampaignRepository {
  constructor(
    @InjectRepository(Campaign)
    private readonly repo: Repository<Campaign>,
  ) {}

  baseQuery(): SelectQueryBuilder<Campaign> {
    return this.repo.createQueryBuilder('campaign');
  }

  findOne(
    filters: CampaignFindFilters,
    options?: CampaignFindOptions,
  ): Promise<Campaign | null> {
    return this.repo.findOne({
      where: this.buildWhere(filters),
      relations: options?.relations,
    });
  }

  findMany(
    filters: CampaignFindFilters,
    options?: CampaignFindOptions,
  ): Promise<Campaign[]> {
    return this.repo.find({
      where: this.buildWhere(filters),
      relations: options?.relations,
    });
  }

  private buildWhere(filters: CampaignFindFilters): FindOptionsWhere<Campaign> {
    const where: FindOptionsWhere<Campaign> = {};

    if (filters.id !== undefined) {
      where.id = filters.id;
    }

    if (filters.ids !== undefined) {
      where.id = In(filters.ids);
    }

    if (filters.advertiserId !== undefined) {
      where.advertiserId = filters.advertiserId;
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    if (filters.statuses !== undefined) {
      where.status = In(filters.statuses);
    }

    if (filters.visibility !== undefined) {
      where.campaignVisibility = filters.visibility;
    }

    return where;
  }

  async findCampaignsByIdsWithCategories(ids: string[]): Promise<Campaign[]> {
    return this.repo
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.categories', 'category')
      .leftJoinAndSelect('campaign.contentTypes', 'contentType')
      .leftJoinAndSelect('campaign.implementationTypes', 'implementationType')
      .where('campaign.id IN (:...ids)', { ids })
      .orderBy('campaign.createdAt', 'DESC')
      .getMany();
  }

  applyAdvertiserMyCampaignsFilters(
    qb: SelectQueryBuilder<Campaign>,
    query: GetAdvertiserMyCampaignsQueryDto,
  ): void {
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

    if (query.contentTypeIds?.length) {
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from('campaign_content_types', 'cct')
          .where('cct."campaignId" = campaign.id')
          .andWhere('cct."contentTypeId" IN (:...filterContentTypeIds)')
          .getQuery();
        return `EXISTS ${sub}`;
      });
      qb.setParameter('filterContentTypeIds', query.contentTypeIds);
    }

    if (query.budgetFrom !== undefined) {
      qb.andWhere('campaign.budget >= :budgetFrom', {
        budgetFrom: query.budgetFrom,
      });
    }

    if (query.budgetTo !== undefined) {
      qb.andWhere('campaign.budget <= :budgetTo', { budgetTo: query.budgetTo });
    }

    this.applySearchFilter(qb, query.search);
  }

  applyCommonCampaignFilters<T>(
    qb: SelectQueryBuilder<T>,
    query: CampaignCommonFilterInput,
  ): void {
    this.applySearchFilter(qb, query.search);

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

    if (query.contentTypeIds?.length) {
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from('campaign_content_types', 'cct_common')
          .where('cct_common."campaignId" = campaign.id')
          .andWhere(
            'cct_common."contentTypeId" IN (:...commonFilterContentTypeIds)',
          )
          .getQuery();
        return `EXISTS ${sub}`;
      });
      qb.setParameter('commonFilterContentTypeIds', query.contentTypeIds);
    }

    if (query.implementationTypeIds?.length) {
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from('campaign_implementation_types', 'cit_common')
          .where('cit_common."campaignId" = campaign.id')
          .andWhere(
            'cit_common."implementationTypeId" IN (:...commonFilterImplementationTypeIds)',
          )
          .getQuery();
        return `EXISTS ${sub}`;
      });
      qb.setParameter(
        'commonFilterImplementationTypeIds',
        query.implementationTypeIds,
      );
    }
  }

  applyMembershipFilter(
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

  applyMatchOrdering(
    qb: SelectQueryBuilder<Campaign>,
    contentTypeIds: string[],
    platforms: string[],
    categoryIds: string[],
  ): void {
    const parts: string[] = [];

    if (contentTypeIds.length) {
      parts.push(
        `CASE WHEN EXISTS (
          SELECT 1 FROM campaign_content_types cct_match
          WHERE cct_match."campaignId" = campaign.id
            AND cct_match."contentTypeId" = ANY(:matchContentTypeIds)
        ) THEN 1 ELSE 0 END`,
      );
      qb.setParameter('matchContentTypeIds', contentTypeIds);
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

  applyInfluencerListFields(qb: SelectQueryBuilder<Campaign>): void {
    qb.leftJoinAndSelect('campaign.contentTypes', 'cTypeList');
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
      'campaign.createdAt',
      'cTypeList.id',
      'cTypeList.name',
    ]);
  }

  private applySearchFilter<T>(
    qb: SelectQueryBuilder<T>,
    search?: string,
  ): void {
    if (!search) return;

    const trimmed = search.trim();
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
}
