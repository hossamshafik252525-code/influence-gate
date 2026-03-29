import { TargetPlatform, ContentTypeOffer, ImplementationType } from '../../../common/enums';
import { InfluencerType } from '../enums';
import { PaginatedResult } from '../../../common/interfaces';

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
  campaignNumber: number;
  name: string;
  description: string;
  category: { id: string; name: string } | null;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  contentDescription: string;
  implementationType: ImplementationType;
  implementationPeriodDays: number;
  deadlineDate: Date;
  influencerPrice: number;
  requiredInfluencersCount: number;
  influencerType: InfluencerType;
  hasApplied: boolean;
}

export type InfluencerCampaignsResult = PaginatedResult<InfluencerCampaignListItem>;
