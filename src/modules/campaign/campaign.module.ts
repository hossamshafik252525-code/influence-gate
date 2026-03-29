import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignInvitedInfluencer } from './entities/campaign-invited-influencer.entity';
import { AdvertiserCampaignController } from './controllers/advertiser-campaign.controller';
import { AdminCampaignController } from './controllers/admin-campaign.controller';
import { InfluencerCampaignController } from './controllers/influencer-campaign.controller';
import { CampaignCreationService } from './services/campaign-creation.service';
import { CampaignSubmissionService } from './services/campaign-submission.service';
import { CampaignReviewService } from './services/campaign-review.service';
import { CampaignLifecycleService } from './services/campaign-lifecycle.service';
import { CampaignQueryService } from './services/campaign-query.service';
import { InfluencerCampaignQueryService } from './services/influencer-campaign-query.service';
import { CampaignApplication } from './entities/campaign-application.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignInvitedInfluencer, CampaignApplication]),
    NotificationsModule,
    CloudinaryModule,
    CategoriesModule,
    UsersModule,
    PlatformSettingsModule,
  ],
  controllers: [AdvertiserCampaignController, AdminCampaignController, InfluencerCampaignController],
  providers: [
    CampaignCreationService,
    CampaignSubmissionService,
    CampaignReviewService,
    CampaignLifecycleService,
    CampaignQueryService,
    InfluencerCampaignQueryService,
  ],
  exports: [CampaignCreationService, CampaignQueryService],
})
export class CampaignModule {}
