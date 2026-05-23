import { Injectable } from '@nestjs/common';
import { AdvertiserWalletService } from '../../wallet/services/advertiser/advertiser-wallet.service';
import { CampaignReportRepository } from '../repositories/campaign-report.repository';
import { AdvertiserReportMapper } from '../mappers/advertiser-report.mapper';
import { GetAdvertiserReportsQueryDto } from '../dto';
import {
  AdvertiserReportListItem,
  AdvertiserReportsResponse,
  AdvertiserReportsStatistics,
} from '../interfaces';

@Injectable()
export class CampaignReportQueryService {
  constructor(
    private readonly campaignReportRepository: CampaignReportRepository,
    private readonly advertiserWalletService: AdvertiserWalletService,
  ) {}

  async getAdvertiserReports(
    advertiserId: string,
    query: GetAdvertiserReportsQueryDto,
  ): Promise<AdvertiserReportsResponse> {
    const statistics = await this.buildStatistics(advertiserId);

    const usePagination = query.page !== undefined || query.limit !== undefined;

    if (!usePagination) {
      const reports =
        await this.campaignReportRepository.findAllForAdvertiser(
          advertiserId,
          query,
        );
      const data: AdvertiserReportListItem[] = reports.map(
        AdvertiserReportMapper.toListItem,
      );
      return {
        data,
        statistics,
        pagination: { total: data.length, page: null, limit: null },
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { rows, total } =
      await this.campaignReportRepository.findPaginatedForAdvertiser(
        advertiserId,
        query,
        page,
        limit,
      );

    return {
      data: rows.map(AdvertiserReportMapper.toListItem),
      statistics,
      pagination: { total, page, limit },
    };
  }

  private async buildStatistics(
    advertiserId: string,
  ): Promise<AdvertiserReportsStatistics> {
    const counts =
      await this.campaignReportRepository.getCountsForAdvertiser(advertiserId);
    const walletSummary =
      await this.advertiserWalletService.getSummary(advertiserId);

    return {
      totalPaid: walletSummary.totalPaid,
      completedCampaignsCount: counts.completedCount,
      discardedCampaignsCount: counts.discardedCount,
      totalCampaignsCount: counts.totalCount,
    };
  }
}
