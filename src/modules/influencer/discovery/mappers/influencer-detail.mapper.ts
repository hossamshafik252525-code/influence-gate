import { SocialPlatform } from '../../../social-linking/entities/social-platform.entity';
import { InfluencerCard } from '../interfaces/influencer-card.interface';
import {
  InfluencerDetail,
  InfluencerSocialPlatformItem,
} from '../interfaces/influencer-detail.interface';

export class InfluencerDetailMapper {
  static toDetail(
    card: InfluencerCard,
    socialPlatforms: SocialPlatform[] | null,
  ): InfluencerDetail {
    return {
      ...card,
      socialPlatforms: socialPlatforms ? socialPlatforms.map((sp) => this.toPlatform(sp)) : null,
    };
  }

  private static toPlatform(sp: SocialPlatform): InfluencerSocialPlatformItem {
    const stats = sp.statistics ?? {};
    const followersCount = Number(
      stats.followersCount ?? stats.followerCount ?? stats.fanCount ?? 0,
    );
    return {
      id: sp.id,
      platform: sp.platform,
      platformUsername: sp.platformUsername ?? null,
      followersCount,
      statistics: sp.statistics ?? null,
    };
  }
}
