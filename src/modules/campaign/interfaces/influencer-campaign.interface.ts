import { TargetPlatform, ContentTypeOffer, ImplementationType } from '../../../common/enums';
import {
  InfluencerType,
  ResolvedCampaignStatus,
} from '../enums';
import { ApplicationStatus } from '../applications/enums';
import { SubmissionStatus } from '../submissions/enums';
import { InvitationStatus } from '../invitations/enums';
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

export type GetNewCampaignsResult = PaginatedResult<NewCampaignListItem>;
export type GetMyCampaignsResult = PaginatedResult<MyCampaignListItem>;

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
  application?: { id: string; status: ApplicationStatus; offerPrice: number | null };
  submission?: ApplicationSubmissionDetail;
  invitation?: { id: string; status: InvitationStatus; orderedServices: OrderedServiceDetail[] };
}
