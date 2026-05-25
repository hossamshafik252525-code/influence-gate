import { SocialPlatformName } from '../../../social-linking/enums';
import { InfluencerCategoryItem } from './influencer-card.interface';

export interface InfluencerPlatformNoHistory {
  followersCount: number;
}

export interface InfluencerPlatformWithHistory {
  followersCount: number;
  platformUsername: string | null;
  statistics: Record<string, unknown> | null;
  lastSyncedAt: Date | null;
}

export type InfluencerSocialPlatformItem =
  | InfluencerPlatformNoHistory
  | InfluencerPlatformWithHistory;

export type InfluencerDetailSocialPlatforms = Partial<
  Record<SocialPlatformName, InfluencerSocialPlatformItem>
>;

export interface InfluencerDetail {
  id: string;
  fullName: string;
  userName: string | null;
  profileImageUrl: string | null;
  description: string | null;
  price: number;
  rating: number;
  ratingCount: number;
  completedCampaignsCount: number;
  categories: InfluencerCategoryItem[];
  socialPlatforms: InfluencerDetailSocialPlatforms;
}
