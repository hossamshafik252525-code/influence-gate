import { PaginatedResult } from '../../../../common/interfaces';
import { ApplicationStatus } from '../enums/application-status.enum';
import { CampaignListItemBase } from '../../interfaces/influencer-campaign.interface';

export interface InfluencerApplicationItem {
  id: string;
  status: ApplicationStatus;
  offerPrice: number | null;
  createdAt: Date;
  campaign: CampaignListItemBase;
}

export type GetInfluencerApplicationsResult = PaginatedResult<InfluencerApplicationItem>;

export interface ApplicationInfluencerSummary {
  fullName: string;
  rating: number;
  ratingCount: number;
  completedCampaignsCount: number;
}

export interface CampaignApplicationItem {
  id: string;
  campaignId: string;
  influencerId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  influencer: ApplicationInfluencerSummary;
}

export type GetApplicationsResult = PaginatedResult<CampaignApplicationItem>;
