import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { SocialLinkingService } from '../../../social-linking/social-linking.service';

export interface InfluencerMatchSignals {
  contentTypes: string[];
  platforms: string[];
  categoryIds: string[];
}

export interface InfluencerProfileRaw {
  profile: InfluencerProfile;
  totalFollowers: number;
}

@Injectable()
export class InfluencerProfileQueryService {
  constructor(
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepository: Repository<InfluencerProfile>,
    private readonly socialLinkingService: SocialLinkingService,
  ) {}

  async getProfile(userId: string): Promise<InfluencerProfile> {
    const profile = await this.influencerProfileRepository.findOne({
      where: { userId },
      relations: ['user', 'user.country', 'categories'],
    });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    return profile;
  }

  async getNumbers(userId: string): Promise<InfluencerProfileRaw> {
    const profile = await this.influencerProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    const totalFollowers = await this.calculateTotalFollowers(userId);

    return { profile, totalFollowers };
  }

  async loadInfluencerMatchSignals(userId: string): Promise<InfluencerMatchSignals> {
    const profile = await this.influencerProfileRepository.findOne({
      where: { userId },
      relations: ['categories'],
    });

    const categories = profile?.categories ?? [];

    return {
      contentTypes: profile?.contentType ? [profile.contentType as string] : [],
      platforms: profile?.includedPlatforms
        ? (profile.includedPlatforms as string[])
        : [],
      categoryIds: [...new Set(categories.map((c) => c.id))],
    };
  }

  private async calculateTotalFollowers(userId: string): Promise<number> {
    const { platforms } = await this.socialLinkingService.getLinkedPlatforms(userId);

    if (!platforms || platforms.length === 0) {
      return 0;
    }

    return platforms.reduce((total, platform) => {
      const stats = platform.statistics;
      if (!stats) {
        return total;
      }
      const followers = stats.followersCount ?? stats.followerCount ?? stats.fanCount ?? 0;
      return total + Number(followers);
    }, 0);
  }
}
