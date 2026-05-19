import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialPlatform } from './entities/social-platform.entity';
import { MetaStrategy, TikTokStrategy } from './strategies';
import { Platform } from '../../common/enums';
import { SocialProviderStrategy } from './interfaces/social-provider.interface';
import { InfluencerProfile } from '../influencer/entities/influencer-profile.entity';
import { InfluencerFollowerSyncService } from './services/influencer-follower-sync.service';

@Injectable()
export class SocialLinkingService {
  private readonly logger = new Logger(SocialLinkingService.name);

  constructor(
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
    private readonly metaStrategy: MetaStrategy,
    private readonly tiktokStrategy: TikTokStrategy,
    private readonly followerSyncService: InfluencerFollowerSyncService,
  ) {}

  getMetaAuthUrl(): { url: string } {
    return this.metaStrategy.getAuthUrl();
  }

  async getLinkedPlatforms(userId: string) {
    const influencerProfileId = await this.resolveProfileId(userId);
    const platforms = await this.socialPlatformRepo.find({
      where: { influencerProfileId },
      select: [
        'id',
        'platform',
        'platformUserId',
        'platformUsername',
        'profileData',
        'statistics',
        'connectedAt',
        'lastSyncedAt',
      ],
    });

    return { platforms };
  }

  async hasLinkedPlatforms(userId: string): Promise<boolean> {
    const influencerProfileId = await this.resolveProfileId(userId);
    const count = await this.socialPlatformRepo.count({ where: { influencerProfileId } });
    return count > 0;
  }

  async countLinkedPlatforms(userId: string): Promise<number> {
    const influencerProfileId = await this.resolveProfileId(userId);
    return this.socialPlatformRepo.count({ where: { influencerProfileId } });
  }

  async refreshPlatformStats(userId: string, socialPlatformId: string) {
    const influencerProfileId = await this.resolveProfileId(userId);
    const record = await this.findPlatformOrFail(influencerProfileId, socialPlatformId);
    const strategy = this.resolveStrategy(record.platform);

    const refreshedToken = await strategy.refreshToken(record);
    record.accessToken = refreshedToken;

    const statistics = await strategy.refreshStats(record);

    await this.socialPlatformRepo.update(record.id, {
      statistics,
      lastSyncedAt: new Date(),
    });

    await this.followerSyncService.recomputeForProfile(influencerProfileId);

    return this.getLinkedPlatforms(userId);
  }

  async unlinkPlatform(userId: string, socialPlatformId: string) {
    const influencerProfileId = await this.resolveProfileId(userId);
    const record = await this.findPlatformOrFail(influencerProfileId, socialPlatformId);
    await this.socialPlatformRepo.remove(record);
    await this.followerSyncService.recomputeForProfile(influencerProfileId);
    return { message: 'تم إلغاء ربط المنصة بنجاح' };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyStatsRefresh() {
    this.logger.log('Starting daily stats refresh for all linked platforms');

    const allPlatforms = await this.socialPlatformRepo.find();

    for (const record of allPlatforms) {
      try {
        await this.refreshSingleRecord(record);
      } catch (error) {
        this.logger.error(
          `Failed to refresh stats for platform ${record.id} (${record.platform}): ${error.message}`,
        );
      }
    }

    this.logger.log(`Daily stats refresh completed for ${allPlatforms.length} records`);
  }

  private async refreshSingleRecord(record: SocialPlatform): Promise<void> {
    const strategy = this.resolveStrategy(record.platform);

    try {
      const refreshedToken = await strategy.refreshToken(record);
      record.accessToken = refreshedToken;
    } catch (error) {
      this.logger.warn(
        `Token refresh failed for ${record.id}, marking as expired: ${error.message}`,
      );
      return;
    }

    const statistics = await strategy.refreshStats(record);

    await this.socialPlatformRepo.update(record.id, {
      statistics,
      lastSyncedAt: new Date(),
    });

    await this.followerSyncService.recomputeForProfile(record.influencerProfileId);
  }

  private async resolveProfileId(userId: string): Promise<string> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي للمؤثر غير موجود');
    }
    return profile.id;
  }

  private async findPlatformOrFail(
    influencerProfileId: string,
    socialPlatformId: string,
  ): Promise<SocialPlatform> {
    const record = await this.socialPlatformRepo.findOne({
      where: { id: socialPlatformId, influencerProfileId },
    });

    if (!record) {
      throw new NotFoundException('هذه المنصة غير مرتبطة بحسابك');
    }

    return record;
  }

  private resolveStrategy(platform: Platform): SocialProviderStrategy {
    if (platform === Platform.FACEBOOK || platform === Platform.INSTAGRAM) {
      return this.metaStrategy;
    }

    if (platform === Platform.TIKTOK) {
      return this.tiktokStrategy;
    }

    throw new NotFoundException('هذه المنصة غير مدعومة حالياً');
  }
}
