import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { SocialLinkingService } from '../../../social-linking/social-linking.service';

export interface InfluencerMatchSignals {
  contentTypeIds: string[];
  platformIds: string[];
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
    @Inject(forwardRef(() => SocialLinkingService))
    private readonly socialLinkingService: SocialLinkingService,
  ) {}

  async getProfile(userId: string): Promise<InfluencerProfile> {
    const profile = await this.influencerProfileRepository.findOne({
      where: { userId },
      relations: [
        'user',
        'user.country',
        'categories',
        'contentTypes',
        'implementationTypes',
        'platforms',
      ],
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
      relations: ['categories', 'contentTypes', 'platforms'],
    });

    const categories = profile?.categories ?? [];
    const contentTypes = profile?.contentTypes ?? [];
    const platforms = profile?.platforms ?? [];

    return {
      contentTypeIds: [...new Set(contentTypes.map((ct) => ct.id))],
      platformIds: [...new Set(platforms.map((p) => p.id))],
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
