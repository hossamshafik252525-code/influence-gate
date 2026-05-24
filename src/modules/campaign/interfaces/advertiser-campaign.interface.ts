import { InfluencerType } from '../../../common/enums';
import { CampaignStatus, CampaignStep, CampaignVisibility } from '../enums';
import { InvitationStatus } from '../invitations/enums';

export interface NamedRelationItem {
  id: string;
  name: string;
}

export interface AdvertiserCampaignListItem {
  id: string;
  campaignNumber: number;
  status: CampaignStatus;
  currentStep: CampaignStep;
  name: string | null;
  categories: NamedRelationItem[];
  platforms: NamedRelationItem[];
  startDate: Date | null;
  endDate: Date | null;
  applicationDeadlineDate: Date | null;
  budget: number | null;
  createdAt: Date;
}

export interface AdvertiserInvitedInfluencerItem {
  id: string;
  influencerId: string;
  status: InvitationStatus;
  price: number;
  profileImageUrl: string | null;
  rating: number;
  completedCampaignsCount: number;
  implementationTypes?: NamedRelationItem[];
  contentTypes?: NamedRelationItem[];
  description?: string;
  implementationPeriodDays?: number;
  platforms?: NamedRelationItem[];
}

export interface AdvertiserCampaignDetail {
  id: string;
  campaignNumber: number;
  status: CampaignStatus;
  currentStep: CampaignStep;
  name: string | null;
  description: string | null;
  categories: NamedRelationItem[] | null;
  platforms: NamedRelationItem[];
  implementationTypes: NamedRelationItem[];
  campaignVisibility: CampaignVisibility | null;
  startDate: Date | null;
  endDate: Date | null;
  applicationDeadlineDate: Date | null;
  contentTypes: NamedRelationItem[];
  contentDescription: string | null;
  contentPdfUrl: string | null;
  influencerType: InfluencerType | null;
  requiredInfluencersCount: number | null;
  invitedInfluencers: AdvertiserInvitedInfluencerItem[] | null;
  budget: number | null;
}
