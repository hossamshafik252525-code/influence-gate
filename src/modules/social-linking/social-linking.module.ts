import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { SocialLinkingController } from './social-linking.controller';
import { SocialLinkingService } from './social-linking.service';
import { SocialPlatform } from './entities/social-platform.entity';
import { MetaStrategy, MetaController } from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialPlatform]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SocialLinkingController, MetaController],
  providers: [SocialLinkingService, MetaStrategy],
  exports: [SocialLinkingService],
})
export class SocialLinkingModule {}
