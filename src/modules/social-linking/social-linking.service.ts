import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialPlatform } from './entities/social-platform.entity';
import { MetaStrategy, SnapchatStrategy } from './strategies';
import { Platform } from '../../common/enums';

@Injectable()
export class SocialLinkingService {
  private readonly logger = new Logger(SocialLinkingService.name);

  constructor(
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    private readonly metaStrategy: MetaStrategy,
    private readonly snapchatStrategy: SnapchatStrategy,
  ) {}

  getMetaAuthUrl(): { url: string } {
    return this.metaStrategy.getAuthUrl();
  }

  async getLinkedPlatforms(userId: string) {
    const platforms = await this.socialPlatformRepo.find({
      where: { userId },
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
    const count = await this.socialPlatformRepo.count({ where: { userId } });
    return count > 0;
  }

  async refreshPlatformStats(userId: string, platform: Platform) {
    const record = await this.findPlatformOrFail(userId, platform);
    const strategy = this.resolveStrategy(platform);

    const refreshedToken = await strategy.refreshToken(record);
    record.accessToken = refreshedToken;

    const statistics = await strategy.refreshStats(record);

    await this.socialPlatformRepo.update(record.id, {
      statistics,
      lastSyncedAt: new Date(),
    });

    return this.getLinkedPlatforms(userId);
  }

  async unlinkPlatform(userId: string, platform: Platform) {
    const record = await this.findPlatformOrFail(userId, platform);
    await this.socialPlatformRepo.remove(record);
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
  }

  private async findPlatformOrFail(
    userId: string,
    platform: Platform,
  ): Promise<SocialPlatform> {
    const record = await this.socialPlatformRepo.findOne({
      where: { userId, platform },
    });

    if (!record) {
      throw new NotFoundException('هذه المنصة غير مرتبطة بحسابك');
    }

    return record;
  }

  private resolveStrategy(platform: Platform): MetaStrategy | SnapchatStrategy {
    if (platform === Platform.FACEBOOK || platform === Platform.INSTAGRAM) {
      return this.metaStrategy;
    }

    if (platform === Platform.SNAPCHAT) {
      return this.snapchatStrategy;
    }

    throw new NotFoundException('هذه المنصة غير مدعومة حالياً');
  }
}
