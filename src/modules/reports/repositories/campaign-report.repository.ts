import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CampaignReport } from '../entities/campaign-report.entity';
import { Category } from '../../categories/entities/category.entity';
import { ContentType } from '../../content-types/entities/content-type.entity';
import { TargetPlatform } from '../../../common/enums';
import { ReportStatus } from '../enums';
import { GetAdvertiserReportsQueryDto } from '../dto';

export interface CreateCampaignReportInput {
  advertiserId: string;
  campaignId: string;
  campaignNumber: number;
  campaignName: string | null;
  status: ReportStatus;
  campaignVisibility: CampaignReport['campaignVisibility'];
  categories: Category[];
  includedPlatforms: TargetPlatform[] | null;
  contentTypes: ContentType[];
  acceptedSubmissionsInfluencersCount: number;
  actualPaid: number;
  startDate: Date | null;
  endDate: Date | null;
  applicationDeadlineDate: Date | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
}

export interface AdvertiserReportsCounts {
  completedCount: number;
  discardedCount: number;
  totalCount: number;
}

@Injectable()
export class CampaignReportRepository {
  constructor(
    @InjectRepository(CampaignReport)
    private readonly repo: Repository<CampaignReport>,
  ) {}

  async existsForCampaign(campaignId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { campaignId } });
    return count > 0;
  }

  async create(input: CreateCampaignReportInput): Promise<CampaignReport> {
    const { contentTypes, ...rest } = input;
    const entity = this.repo.create({
      ...rest,
      contentTypes: contentTypes,
    });
    return this.repo.save(entity);
  }

  async findAllForAdvertiser(
    advertiserId: string,
    query: GetAdvertiserReportsQueryDto,
  ): Promise<CampaignReport[]> {
    const qb = this.buildFilteredQuery(advertiserId, query);
    const reports = await qb
      .orderBy('report.createdAt', 'DESC')
      .getMany();
    return this.attachCategories(reports);
  }

  async findPaginatedForAdvertiser(
    advertiserId: string,
    query: GetAdvertiserReportsQueryDto,
    page: number,
    limit: number,
  ): Promise<{ rows: CampaignReport[]; total: number }> {
    const qb = this.buildFilteredQuery(advertiserId, query);
    const [rows, total] = await qb
      .orderBy('report.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const withCategories = await this.attachCategories(rows);
    return { rows: withCategories, total };
  }

  async getCountsForAdvertiser(
    advertiserId: string,
  ): Promise<AdvertiserReportsCounts> {
    const rows: { status: ReportStatus; count: string }[] = await this.repo
      .createQueryBuilder('report')
      .select('report.status', 'status')
      .addSelect('COUNT(report.id)', 'count')
      .where('report.advertiserId = :advertiserId', { advertiserId })
      .groupBy('report.status')
      .getRawMany();

    let completedCount = 0;
    let discardedCount = 0;

    for (const row of rows) {
      const value = parseInt(row.count, 10) || 0;
      if (row.status === ReportStatus.COMPLETED) completedCount = value;
      if (row.status === ReportStatus.DISCARDED) discardedCount = value;
    }

    return {
      completedCount,
      discardedCount,
      totalCount: completedCount + discardedCount,
    };
  }

  private buildFilteredQuery(
    advertiserId: string,
    query: GetAdvertiserReportsQueryDto,
  ): SelectQueryBuilder<CampaignReport> {
    const qb = this.repo
      .createQueryBuilder('report')
      .where('report.advertiserId = :advertiserId', { advertiserId });

    if (query.statuses?.length) {
      qb.andWhere('report.status IN (:...statuses)', {
        statuses: query.statuses,
      });
    }

    if (query.categoryIds?.length) {
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from('campaign_report_categories', 'rc')
          .where('rc."reportId" = report.id')
          .andWhere('rc."categoryId" IN (:...filterCategoryIds)')
          .getQuery();
        return `EXISTS ${sub}`;
      });
      qb.setParameter('filterCategoryIds', query.categoryIds);
    }

    if (query.platforms?.length) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(report.includedPlatforms) AS pl_elem
          WHERE pl_elem = ANY(:platforms)
        )`,
        { platforms: query.platforms },
      );
    }

    if (query.contentTypeIds?.length) {
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from('campaign_report_content_types', 'rct')
          .where('rct."reportId" = report.id')
          .andWhere('rct."contentTypeId" IN (:...filterReportContentTypeIds)')
          .getQuery();
        return `EXISTS ${sub}`;
      });
      qb.setParameter('filterReportContentTypeIds', query.contentTypeIds);
    }

    if (query.actualPaidFrom !== undefined) {
      qb.andWhere('report.actualPaid >= :actualPaidFrom', {
        actualPaidFrom: query.actualPaidFrom,
      });
    }

    if (query.actualPaidTo !== undefined) {
      qb.andWhere('report.actualPaid <= :actualPaidTo', {
        actualPaidTo: query.actualPaidTo,
      });
    }

    if (query.startDate) {
      qb.andWhere('report.startDate >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('report.startDate <= :endDate', {
        endDate: query.endDate,
      });
    }

    if (query.search) {
      const trimmed = query.search.trim();
      const isNumeric = /^\d+$/.test(trimmed);
      if (isNumeric) {
        qb.andWhere(
          '(LOWER(report.campaignName) LIKE LOWER(:search) OR report.campaignNumber = :num)',
          { search: `%${trimmed}%`, num: parseInt(trimmed, 10) },
        );
      } else {
        qb.andWhere('LOWER(report.campaignName) LIKE LOWER(:search)', {
          search: `%${trimmed}%`,
        });
      }
    }

    return qb;
  }

  private async attachCategories(
    reports: CampaignReport[],
  ): Promise<CampaignReport[]> {
    if (reports.length === 0) return reports;
    const ids = reports.map((r) => r.id);
    const withRelations = await this.repo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.categories', 'category')
      .leftJoinAndSelect('report.contentTypes', 'contentType')
      .where('report.id IN (:...ids)', { ids })
      .getMany();
    const byId = new Map(
      withRelations.map((r) => [
        r.id,
        { categories: r.categories, contentTypes: r.contentTypes },
      ]),
    );
    for (const report of reports) {
      const found = byId.get(report.id);
      report.categories = found?.categories ?? [];
      report.contentTypes = found?.contentTypes ?? [];
    }
    return reports;
  }
}
