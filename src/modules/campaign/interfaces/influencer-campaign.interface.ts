import { TargetPlatform, ContentTypeOffer, ImplementationType } from '../../../common/enums';
import {
  InfluencerType,
  ApplicationStatus,
  SubmissionStatus,
  InvitationStatus,
  ResolvedCampaignStatus,
} from '../enums';
import { PaginatedResult } from '../../../common/interfaces';

export interface CampaignListItemBase {
  id: string;
  campaignNumber: number;
  name: string;
  description: string;
  status: ResolvedCampaignStatus;
  relevantDeadline: Date | null;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  influencerPrice: number;
}

export type NewCampaignListItem = CampaignListItemBase;

export type MyCampaignListItem = CampaignListItemBase;

export interface InfluencerApplicationItem {
  id: string;
  status: ApplicationStatus;
  createdAt: Date;
  campaign: CampaignListItemBase;
}

export interface InfluencerInvitationItem {
  id: string;
  status: InvitationStatus;
  createdAt: Date;
  campaign: CampaignListItemBase;
}

export type GetNewCampaignsResult = PaginatedResult<NewCampaignListItem>;
export type GetMyCampaignsResult = PaginatedResult<MyCampaignListItem>;
export type GetInfluencerApplicationsResult = PaginatedResult<InfluencerApplicationItem>;
export type GetInfluencerInvitationsResult = PaginatedResult<InfluencerInvitationItem>;

export interface OrderedServiceDetail {
  id: string;
  price: number;
  implementationType: ImplementationType;
  contentType: ContentTypeOffer;
  description: string;
  implementationPeriodDays: number;
  includedPlatforms: TargetPlatform[];
}

export interface ApplicationSubmissionDetail {
  id: string;
  status: SubmissionStatus;
  links: string[];
  fileUrls: string[] | null;
  modificationDetails: string | null;
  modificationFileUrls: string[] | null;
}

export interface CampaignDetailResult {
  id: string;
  campaignNumber: number;
  status: ResolvedCampaignStatus;
  name: string;
  description: string;
  category: { id: string; name: string } | null;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  contentDescription: string;
  requirementsFile: string;
  implementationType: ImplementationType;
  implementationPeriodDays: number;
  relevantDeadline: Date | null;
  influencerPrice?: number;
  orderedServicesPrice?: number;
  requiredInfluencersCount: number;
  influencerType: InfluencerType;
  application?: { id: string; status: ApplicationStatus };
  submission?: ApplicationSubmissionDetail;
  invitation?: { id: string; status: InvitationStatus; orderedServices: OrderedServiceDetail[] };
}

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
