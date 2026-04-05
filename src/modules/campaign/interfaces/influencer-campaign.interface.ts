import { TargetPlatform, ContentTypeOffer, ImplementationType } from '../../../common/enums';
import { InfluencerType, ApplicationStatus, CampaignStatus, SubmissionStatus } from '../enums';
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

export interface InfluencerCampaignDetail {
  id: string;
  status:string;
  campaignNumber: number;
  name: string;
  description: string;
  category: { id: string; name: string } | null;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  contentDescription: string;
  requirementsFile:string;
  implementationType: ImplementationType;
  implementationPeriodDays: number;
  deadlineDate: Date;
  implementationStartDate: Date | null;
  implementationEndDate: Date | null;
  influencerPrice: number;
  requiredInfluencersCount: number;
  influencerType: InfluencerType;
  hasApplied: boolean;
}

export type InfluencerCampaignsResult = PaginatedResult<InfluencerCampaignListItem>;

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

export interface ApplicationDetailResult extends InfluencerCampaignDetail {
  application: {
    id: string;
    status: ApplicationStatus;
  };
  submission: ApplicationSubmissionDetail | null;
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

export interface InvitationListItem {
  id: string;
  campaignId: string;
  createdAt: Date;
  campaign: InvitationCampaignSummary;
}

export type MyInvitationsResult = PaginatedResult<InvitationListItem>;
