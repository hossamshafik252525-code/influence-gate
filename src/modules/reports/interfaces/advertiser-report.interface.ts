import { CampaignVisibility } from '../../campaign/enums';
import { ReportStatus } from '../enums';

export interface AdvertiserReportCategoryItem {
  id: string;
  name: string;
}

export interface AdvertiserReportContentTypeItem {
  id: string;
  name: string;
}

export interface AdvertiserReportPlatformItem {
  id: string;
  name: string;
}

export interface AdvertiserReportListItem {
  id: string;
  campaignId: string;
  campaignNumber: number;
  campaignName: string | null;
  status: ReportStatus;
  campaignVisibility: CampaignVisibility | null;
  categories: AdvertiserReportCategoryItem[];
  platforms: AdvertiserReportPlatformItem[];
  contentTypes: AdvertiserReportContentTypeItem[];
  acceptedSubmissionsInfluencersCount: number;
  actualPaid: number;
  startDate: Date | null;
  endDate: Date | null;
  applicationDeadlineDate: Date | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
}

export interface AdvertiserReportsStatistics {
  totalPaid: number;
  completedCampaignsCount: number;
  discardedCampaignsCount: number;
  totalCampaignsCount: number;
}

export interface AdvertiserReportsResponse {
  data: AdvertiserReportListItem[];
  statistics: AdvertiserReportsStatistics;
  pagination: { total: number; page: number | null; limit: number | null };
}
