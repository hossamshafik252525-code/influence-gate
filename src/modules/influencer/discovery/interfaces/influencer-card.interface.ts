import { InfluencerType } from '../../../../common/enums';
import { PaginatedResult } from '../../../../common/interfaces';
import { User } from '../../../users/entities/user.entity';
import { SocialPlatform } from '../../../social-linking/entities/social-platform.entity';

export interface InfluencerCategoryItem {
  id: string;
  name: string;
}

export interface InfluencerCountryItem {
  id: string;
  name: string;
}

export interface InfluencerPlatformItem {
  id: string;
  name: string;
}

export interface InfluencerCard {
  id: string;
  fullName: string;
  userName: string | null;
  profileImageUrl: string | null;
  totalFollowers: number;
  type: InfluencerType;
  platforms: InfluencerPlatformItem[];
  price: number;
  rating: number;
  ratingCount: number;
  country: InfluencerCountryItem | null;
  categories: InfluencerCategoryItem[];
}

export type InfluencersDiscoveryResult = PaginatedResult<InfluencerCard>;

export interface InfluencersDiscoveryRawRow {
  user: User;
  feeMultiplier: number;
}

export type InfluencersDiscoveryRawResult = PaginatedResult<InfluencersDiscoveryRawRow>;

export interface InfluencerDetailRawResult {
  user: User;
  socialPlatforms: SocialPlatform[] | null;
  feeMultiplier: number;
  hasHistory: boolean;
}
