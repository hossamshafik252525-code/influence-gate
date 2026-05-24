import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { SocialLinkingController } from './social-linking.controller';
import { SocialLinkingService } from './social-linking.service';
import { SocialPlatform } from './entities/social-platform.entity';
import { InfluencerProfile } from '../influencer/entities/influencer-profile.entity';
import { MetaStrategy, MetaController, TikTokStrategy, TikTokController } from './strategies';
import { InfluencerFollowerSyncService } from './services/influencer-follower-sync.service';
import { InfluencerModule } from '../influencer/influencer.module';
import { PlatformsModule } from '../platforms/platforms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialPlatform, InfluencerProfile]),
    HttpModule,
    ScheduleModule.forRoot(),
    forwardRef(() => InfluencerModule),
    PlatformsModule,
  ],
  controllers: [SocialLinkingController, MetaController, TikTokController],
  providers: [SocialLinkingService, MetaStrategy, TikTokStrategy, InfluencerFollowerSyncService],
  exports: [SocialLinkingService, InfluencerFollowerSyncService],
})
export class SocialLinkingModule {}
