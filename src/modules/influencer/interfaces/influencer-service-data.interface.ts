import { ImplementationType, ContentTypeOffer, TargetPlatform } from '../../../common/enums';

export interface InfluencerServiceData {
  id: string;
  influencerProfileId: string;
  implementationType: ImplementationType;
  contentType: ContentTypeOffer;
  description: string;
  price: number;
  implementationPeriodDays: number;
  includedPlatforms: TargetPlatform[];
  createdAt: Date;
  updatedAt: Date;
}
