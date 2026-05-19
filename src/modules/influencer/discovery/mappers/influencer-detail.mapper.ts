import { User } from '../../../users/entities/user.entity';
import { SocialPlatform } from '../../../social-linking/entities/social-platform.entity';
import {
  InfluencerDetail,
  InfluencerDetailSocialPlatforms,
  InfluencerSocialPlatformItem,
} from '../interfaces/influencer-detail.interface';

export interface InfluencerDetailSource {
  user: User;
  socialPlatforms: SocialPlatform[] | null;
  hasHistory: boolean;
  feeMultiplier: number;
}

export class InfluencerDetailMapper {
  static toDetail(source: InfluencerDetailSource): InfluencerDetail {
    const profile = source.user.influencerProfile;
    const basePrice = profile.price != null ? Number(profile.price) : 0;
    const priceWithFee = Math.round(basePrice * source.feeMultiplier * 100) / 100;

    return {
      id: source.user.id,
      fullName: source.user.fullName,
      userName: profile.userName ?? null,
      profileImageUrl: profile.profileImageUrl ?? null,
      description: profile.description ?? null,
      price: priceWithFee,
      rating: Number(profile.rating),
      ratingCount: profile.ratingCount,
      completedCampaignsCount: profile.completedCampaignsCount,
      categories: (profile.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
      socialPlatforms: this.toSocialPlatforms(source.socialPlatforms, source.hasHistory),
    };
  }

  private static toSocialPlatforms(
    platforms: SocialPlatform[] | null,
    hasHistory: boolean,
  ): InfluencerDetailSocialPlatforms {
    if (!platforms || platforms.length === 0) {
      return {};
    }
    const result: InfluencerDetailSocialPlatforms = {};
    for (const sp of platforms) {
      result[sp.platform] = this.toPlatformEntry(sp, hasHistory);
    }
    return result;
  }

  private static toPlatformEntry(
    sp: SocialPlatform,
    hasHistory: boolean,
  ): InfluencerSocialPlatformItem {
    const followersCount = this.extractFollowersCount(sp);
    if (!hasHistory) {
      return { followersCount };
    }
    return {
      followersCount,
      platformUsername: sp.platformUsername ?? null,
      statistics: sp.statistics ?? null,
      lastSyncedAt: sp.lastSyncedAt ?? null,
    };
  }

  private static extractFollowersCount(sp: SocialPlatform): number {
    const stats = sp.statistics ?? {};
    const raw = stats.followersCount ?? stats.followerCount ?? stats.fanCount ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
}
