import { CampaignReport } from '../entities/campaign-report.entity';
import { AdvertiserReportListItem } from '../interfaces/advertiser-report.interface';

export class AdvertiserReportMapper {
  static toListItem(report: CampaignReport): AdvertiserReportListItem {
    return {
      id: report.id,
      campaignId: report.campaignId,
      campaignNumber: report.campaignNumber,
      campaignName: report.campaignName ?? null,
      status: report.status,
      campaignVisibility: report.campaignVisibility ?? null,
      categories: (report.categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
      includedPlatforms: report.includedPlatforms ?? null,
      contentTypes: (report.contentTypes ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
      acceptedSubmissionsInfluencersCount:
        report.acceptedSubmissionsInfluencersCount,
      actualPaid: Number(report.actualPaid),
      startDate: report.startDate ?? null,
      endDate: report.endDate ?? null,
      applicationDeadlineDate: report.applicationDeadlineDate ?? null,
      submittedAt: report.submittedAt ?? null,
      approvedAt: report.approvedAt ?? null,
      createdAt: report.createdAt,
    };
  }
}
