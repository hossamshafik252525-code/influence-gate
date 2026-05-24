import { InfluencerType } from '../../../common/enums';
import { ResolvedCampaignStatus } from '../enums';
import { ApplicationStatus } from '../applications/enums';
import { SubmissionStatus } from '../submissions/enums';
import { InvitationStatus } from '../invitations/enums';
import { PaginatedResult } from '../../../common/interfaces';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../submissions/entities/campaign-submission.entity';

export interface NamedRelationItem {
  id: string;
  name: string;
}

export interface CampaignDetailRawResult {
  campaign: Campaign;
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
  platforms: NamedRelationItem[];
  contentTypes: NamedRelationItem[];
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
  categories: NamedRelationItem[];
  platforms: NamedRelationItem[];
  contentTypes: NamedRelationItem[];
  contentDescription: string;
  requirementsFile: string;
  implementationTypes: NamedRelationItem[];
  startDate: Date | null;
  endDate: Date | null;
  applicationDeadlineDate: Date | null;
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
    implementationTypes?: NamedRelationItem[];
    contentTypes?: NamedRelationItem[];
    description?: string;
    implementationPeriodDays?: number;
    platforms?: NamedRelationItem[];
  };
}
