import { ImplementationType, ContentTypeOffer, TargetPlatform } from '../../../common/enums';
import { CampaignStatus, CampaignStep, InfluencerType, CampaignVisibility } from '../enums';
import { InvitationStatus } from '../invitations/enums';



export interface AdvertiserInvitedInfluencerItem {
  id: string;
  influencerId: string;
  status: InvitationStatus;
  price: number;
  implementationType?: ImplementationType;
  contentType?: ContentTypeOffer;
  description?: string;
  implementationPeriodDays?: number;
  includedPlatforms?: TargetPlatform[];
}

export interface AdvertiserCampaignResult {
  id: string;
  campaignNumber: number;
  status: CampaignStatus;
  currentStep: CampaignStep;
  campaignVisibility: CampaignVisibility | null;
  requiredInfluencersCount: number | null;
  influencerType: InfluencerType | null;
  budget: number | null;
  influencerPrice: number | null;
  invitedInfluencers: AdvertiserInvitedInfluencerItem[];
}
