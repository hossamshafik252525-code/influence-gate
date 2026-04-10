import { TargetPlatform, ContentTypeOffer, ImplementationType } from '../../../common/enums';
import {
  InfluencerType,
  ApplicationStatus,
  CampaignStatus,
  SubmissionStatus,
  InvitationStatus,
} from '../enums';
import { PaginatedResult } from '../../../common/interfaces';

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

export interface InfluencerCampaignListItem {
  id: string;
  campaignNumber: number;
  name: string;
  description: string;
  deadlineDate: Date;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  influencerPrice: number;
}

export interface MyCampaignListItem extends InfluencerCampaignListItem {
  submissionStatus: SubmissionStatus | null;
}

export type InfluencerCampaignsResult = PaginatedResult<InfluencerCampaignListItem>;
export type MyCampaignsResult = PaginatedResult<MyCampaignListItem>;

export interface ApplicationCampaignSummary {
  id: string;
  campaignNumber: number;
  name: string;
  description: string;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  status: CampaignStatus;
  deadlineDate: Date;
  implementationStartDate: Date | null;
  implementationEndDate: Date | null;
}

export interface ApplicationListItem {
  id: string;
  status: ApplicationStatus;
  createdAt: Date;
  campaign: ApplicationCampaignSummary;
}

export type MyApplicationsResult = PaginatedResult<ApplicationListItem>;

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
  status: CampaignStatus;
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
}

export interface InvitationCampaignSummary {
  id: string;
  campaignNumber: number;
  name: string;
  description: string;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  deadlineDate: Date;
  implementationStartDate: Date | null;
  implementationEndDate: Date | null;
  influencerPrice: number;
  status: CampaignStatus;
}

export interface InvitationOrderedServiceItem {
  id: string;
  serviceId: string;
  basePrice: number;
  priceWithFee: number;
  implementationType: ImplementationType;
  contentType: ContentTypeOffer;
  description: string;
  implementationPeriodDays: number;
  includedPlatforms: TargetPlatform[];
}

export interface InvitationListItem {
  id: string;
  campaignId: string;
  status: InvitationStatus;
  createdAt: Date;
  campaign: InvitationCampaignSummary;
  orderedServices: InvitationOrderedServiceItem[];
}

export type MyInvitationsResult = PaginatedResult<InvitationListItem>;
