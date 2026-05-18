import { User } from '../../../users/entities/user.entity';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import {
  InfluencerCard,
  InfluencerServiceCardItem,
} from '../interfaces/influencer-card.interface';

export interface InfluencerCardSource {
  user: User;
  profile: InfluencerProfile;

  totalFollowers: number;
  completedCampaignsCount: number;
  feeMultiplier: number;
}

export class InfluencerCardMapper {
  static toCard(source: InfluencerCardSource): InfluencerCard {
    const services: InfluencerServiceCardItem[] = [];
    if (source.profile.price != null) {
      services.push(this.toServiceItem(source.profile, source.feeMultiplier));
    }
    const priceAverage = services.length > 0 ? services[0].price : 0;

    return {
      id: source.user.id,
      fullName: source.user.fullName,
      profileImageUrl: source.profile.profileImageUrl ?? null,
      totalFollowers: source.totalFollowers,
      completedCampaignsCount: source.completedCampaignsCount,
      rating: Number(source.profile.rating),
      ratingCount: source.profile.ratingCount,
      country: source.user.country
        ? { id: source.user.country.id, name: source.user.country.name }
        : null,
      categories: (source.profile.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
      services,
      priceAverage,
    };
  }

  private static toServiceItem(
    profile: InfluencerProfile,
    feeMultiplier: number,
  ): InfluencerServiceCardItem {
    const basePrice = Number(profile.price);
    const priceWithFee = Math.round(basePrice * feeMultiplier * 100) / 100;
    return {
      id: profile.id,
      implementationType: profile.implementationType,
      contentType: profile.contentType,
      description: profile.description,
      price: priceWithFee,
      implementationPeriodDays: profile.implementationPeriodDays,
      includedPlatforms: profile.includedPlatforms,
    };
  }
}
