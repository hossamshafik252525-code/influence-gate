import { User } from '../../../users/entities/user.entity';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { InfluencerService } from '../../entities/influencer-service.entity';
import {
  InfluencerCard,
  InfluencerServiceCardItem,
} from '../interfaces/influencer-card.interface';

export interface InfluencerCardSource {
  user: User;
  profile: InfluencerProfile;
  services: InfluencerService[];
  totalFollowers: number;
  completedCampaignsCount: number;
  feeMultiplier: number;
}

export class InfluencerCardMapper {
  static toCard(source: InfluencerCardSource): InfluencerCard {
    const services = source.services.map((s) => this.toServiceItem(s, source.feeMultiplier));
    const priceAverage =
      services.length > 0
        ? Math.round(
            (services.reduce((sum, s) => sum + s.price, 0) / services.length) * 100,
          ) / 100
        : 0;

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
      categories: (source.profile.categories ?? [])
        .filter((ic) => !!ic.category)
        .map((ic) => ({ id: ic.category.id, name: ic.category.name })),
      services,
      priceAverage,
    };
  }

  private static toServiceItem(
    service: InfluencerService,
    feeMultiplier: number,
  ): InfluencerServiceCardItem {
    const basePrice = Number(service.price);
    const priceWithFee = Math.round(basePrice * feeMultiplier * 100) / 100;
    return {
      id: service.id,
      implementationType: service.implementationType,
      contentType: service.contentType,
      description: service.description,
      price:priceWithFee,
      implementationPeriodDays: service.implementationPeriodDays,
      includedPlatforms: service.includedPlatforms,
    };
  }
}
