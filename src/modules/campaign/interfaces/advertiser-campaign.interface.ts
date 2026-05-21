import { ImplementationType, ContentTypeOffer, TargetPlatform, InfluencerType } from '../../../common/enums';
import { CampaignStatus, CampaignStep, CampaignVisibility } from '../enums';
import { InvitationStatus } from '../invitations/enums';
export interface AdvertiserCampaignListItem {
  id: string;
  campaignNumber: number;
  status: CampaignStatus;
  currentStep: CampaignStep;
  name: string | null;
  categories: { id: string; name: string }[];
  includedPlatforms: TargetPlatform[] | null;
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
  startDate: Date | null;
  endDate: Date | null;
  applicationDeadlineDate: Date | null;
  contentTypes: ContentTypeOffer[] | null;
  contentDescription: string | null;
  contentPdfUrl: string | null;
  influencerType: InfluencerType | null;
  requiredInfluencersCount: number | null;
  invitedInfluencers: AdvertiserInvitedInfluencerItem[] | null;
  budget: number | null;
}
