import { TargetPlatform, ContentTypeOffer, ImplementationType } from '../../../common/enums';
import {
  InfluencerType,
  ResolvedCampaignStatus,
} from '../enums';
import { ApplicationStatus } from '../applications/enums';
import { SubmissionStatus } from '../submissions/enums';
import { InvitationStatus } from '../invitations/enums';
import { PaginatedResult } from '../../../common/interfaces';
import { Campaign } from '../entities/campaign.entity';
import { Category } from '../../categories/entities/category.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../submissions/entities/campaign-submission.entity';

export interface CampaignDetailRawResult {
  campaign: Campaign;
  categories: Category[];
  application: CampaignApplication | null;
  submission: CampaignSubmission | null;
  invitation: CampaignInvitedInfluencer | null;
}

export interface CampaignListItemBase {
  id: string;
  campaignNumber: number;
  name: string;
  description: string;
  status: ResolvedCampaignStatus;
  relevantDeadline: Date | null;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
}

export type NewCampaignListItem = CampaignListItemBase;

export type MyCampaignListItem = CampaignListItemBase;

export type GetNewCampaignsResult = PaginatedResult<NewCampaignListItem>;
export type GetMyCampaignsResult = PaginatedResult<MyCampaignListItem>;


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
  categories: { id: string; name: string }[];
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  contentDescription: string;
  requirementsFile: string;
  implementationType: ImplementationType;
  implementationPeriodDays: number;
  relevantDeadline: Date | null;
  orderedServicesPrice?: number;
  requiredInfluencersCount: number;
  influencerType: InfluencerType;
  application?: { id: string; status: ApplicationStatus; offerPrice: number | null };
  submission?: ApplicationSubmissionDetail;
  invitation?: {
    id: string;
    status: InvitationStatus;
    price: number;
    implementationType?: ImplementationType;
    contentType?: ContentTypeOffer;
    description?: string;
    implementationPeriodDays?: number;
    includedPlatforms?: TargetPlatform[];
  };
}
