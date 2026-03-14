import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { SocialLinkingController } from './social-linking.controller';
import { SocialLinkingService } from './social-linking.service';
import { SocialPlatform } from './entities/social-platform.entity';
import { MetaStrategy, MetaController, TikTokStrategy, TikTokController } from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialPlatform]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SocialLinkingController, MetaController, TikTokController],
  providers: [SocialLinkingService, MetaStrategy, TikTokStrategy],
  exports: [SocialLinkingService],
})
export class SocialLinkingModule {}
