import { ImplementationType, ContentTypeOffer, TargetPlatform } from '../../../../common/enums';
import { PaginatedResult } from '../../../../common/interfaces';

export interface InfluencerServiceCardItem {
  id: string;
  implementationType: ImplementationType;
  contentType: ContentTypeOffer;
  description: string;
  price: number;
  implementationPeriodDays: number;
  includedPlatforms: TargetPlatform[];
}

export interface InfluencerCategoryItem {
  id: string;
  name: string;
}

export interface InfluencerCountryItem {
  id: string;
  name: string;
}

export interface InfluencerCard {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
  totalFollowers: number;
  completedCampaignsCount: number;
  rating: number;
  ratingCount: number;
  country: InfluencerCountryItem | null;
  categories: InfluencerCategoryItem[];
  services: InfluencerServiceCardItem[];
  priceAverage: number;
}

export type InfluencersDiscoveryResult = PaginatedResult<InfluencerCard>;
