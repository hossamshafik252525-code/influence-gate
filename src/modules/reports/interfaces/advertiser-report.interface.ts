import { CampaignVisibility } from '../../campaign/enums';
import { ContentTypeOffer, TargetPlatform } from '../../../common/enums';
import { ReportStatus } from '../enums';

export interface AdvertiserReportCategoryItem {
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
  includedPlatforms: TargetPlatform[] | null;
  contentTypes: ContentTypeOffer[] | null;
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
