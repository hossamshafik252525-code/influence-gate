import { ImplementationType, ContentTypeOffer, TargetPlatform } from '../../../common/enums';
import { CampaignStatus, CampaignStep, InfluencerType, CampaignVisibility } from '../enums';
import { InvitationStatus } from '../invitations/enums';
export interface AdvertiserCampaignListItem {
  id: string;
  campaignNumber: number;
  status: CampaignStatus;
  currentStep: CampaignStep;
  name: string | null;
  categories: { id: string; name: string }[];
  includedPlatforms: TargetPlatform[] | null;
  deadlineDate: Date | null;
  budget: number | null;
  implementationStartDate: Date | null;
  implementationEndDate: Date | null;
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
  implementationType?: ImplementationType;
  contentType?: ContentTypeOffer;
  description?: string;
  implementationPeriodDays?: number;
  includedPlatforms?: TargetPlatform[];
}

export interface AdvertiserCampaignDetail {
  id: string;
  campaignNumber: number;
  status: CampaignStatus;
  currentStep: CampaignStep;
  name: string | null;
  description: string | null;
  categories: { id: string; name: string }[] | null;
  includedPlatforms: TargetPlatform[] | null;
  implementationType: ImplementationType | null;
  campaignVisibility: CampaignVisibility | null;
  deadlineDate: Date | null;
  implementationPeriodDays: number | null;
  contentTypes: ContentTypeOffer[] | null;
  contentDescription: string | null;
  contentPdfUrl: string | null;
  influencerType: InfluencerType | null;
  requiredInfluencersCount: number | null;
  invitedInfluencers: AdvertiserInvitedInfluencerItem[] | null;
  budget: number | null;
}
