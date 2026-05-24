import { User } from '../../../users/entities/user.entity';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { InfluencerType } from '../../../../common/enums';
import { InfluencerCard } from '../interfaces/influencer-card.interface';
import { MEGA_FOLLOWERS_THRESHOLD } from '../constants/follower-thresholds';

export interface InfluencerCardSource {
  user: User;
  profile: InfluencerProfile;
  totalFollowers: number;
  feeMultiplier: number;
}

export class InfluencerCardMapper {
  static toCard(source: InfluencerCardSource): InfluencerCard {
    const basePrice = source.profile.price != null ? Number(source.profile.price) : 0;
    const priceWithFee = Math.round(basePrice * source.feeMultiplier * 100) / 100;

    return {
      id: source.user.id,
      fullName: source.user.fullName,
      userName: source.profile.userName ?? null,
      profileImageUrl: source.profile.profileImageUrl ?? null,
      totalFollowers: source.totalFollowers,
      type: this.resolveType(source.totalFollowers),
      platforms: (source.profile.platforms ?? []).map((p) => ({
        id: p.id,
        name: p.name,
      })),
      price: priceWithFee,
      rating: Number(source.profile.rating),
      ratingCount: source.profile.ratingCount,
      country: source.user.country
        ? { id: source.user.country.id, name: source.user.country.name }
        : null,
      categories: (source.profile.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
    };
  }

  private static resolveType(totalFollowers: number): InfluencerType {
    return totalFollowers >= MEGA_FOLLOWERS_THRESHOLD ? InfluencerType.MEGA : InfluencerType.MICRO;
  }
}
