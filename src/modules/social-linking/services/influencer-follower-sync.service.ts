import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialPlatform } from '../entities/social-platform.entity';
import { InfluencerProfileManagementService } from '../../influencer/profile/services/influencer-profile-management.service';

@Injectable()
export class InfluencerFollowerSyncService {
  constructor(
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    @Inject(forwardRef(() => InfluencerProfileManagementService))
    private readonly profileManagementService: InfluencerProfileManagementService,
  ) {}

  async recomputeForProfile(influencerProfileId: string): Promise<void> {
    const platforms = await this.socialPlatformRepo.find({
      where: { influencerProfileId },
      select: ['statistics'],
    });
    const total = platforms.reduce((sum, p) => {
      const stats = p.statistics ?? {};
      const followers = Number(
        stats.followersCount ?? stats.followerCount ?? stats.fanCount ?? 0,
      );
      return sum + (Number.isFinite(followers) ? followers : 0);
    }, 0);
    await this.profileManagementService.updateTotalFollowers(influencerProfileId, total);
  }
}
