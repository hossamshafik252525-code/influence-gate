import { InfluencerCard } from './influencer-card.interface';
import { Platform } from '../../../../common/enums';

export interface InfluencerSocialPlatformItem {
  id: string;
  platform: Platform;
  platformUsername: string | null;
  followersCount: number;
  statistics: Record<string, unknown> | null;
}

export interface InfluencerDetail extends InfluencerCard {
  socialPlatforms: InfluencerSocialPlatformItem[] | null;
}
