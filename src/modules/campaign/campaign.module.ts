import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignInvitedInfluencer } from './invitations/entities/campaign-invited-influencer.entity';
import { CampaignApplication } from './applications/entities/campaign-application.entity';
import { CampaignSubmission } from './submissions/entities/campaign-submission.entity';
import { AdvertiserCampaignController } from './controllers/advertiser-campaign.controller';
import { AdminCampaignController } from './controllers/admin-campaign.controller';
import { InfluencerCampaignController } from './controllers/influencer-campaign.controller';
import { CampaignCreationService } from './services/campaign-creation.service';
import { CampaignSubmissionService } from './services/campaign-submission.service';
import { CampaignReviewService } from './services/campaign-review.service';
import { CampaignLifecycleService } from './services/campaign-lifecycle.service';
import { CampaignQueryService } from './services/campaign-query.service';
import { InfluencerCampaignQueryService } from './services/influencer-campaign-query.service';
import { PrivateCampaignLaunchService } from './services/private-campaign-launch.service';
import { InfluencerProfile } from '../influencer/entities/influencer-profile.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { WalletModule } from '../wallet/wallet.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ApplicationsModule } from './applications/applications.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignInvitedInfluencer,
      CampaignSubmission,
      InfluencerProfile,
    ]),
    forwardRef(() => InvitationsModule),
    forwardRef(() => ApplicationsModule),
    forwardRef(() => SubmissionsModule),
    NotificationsModule,
    CloudinaryModule,
    CategoriesModule,
    UsersModule,
    PlatformSettingsModule,
    WalletModule,
  ],
  controllers: [
    AdvertiserCampaignController,
    AdminCampaignController,
    InfluencerCampaignController,
  ],
  providers: [
    CampaignCreationService,
    CampaignSubmissionService,
    CampaignReviewService,
    CampaignLifecycleService,
    CampaignQueryService,
    InfluencerCampaignQueryService,
    PrivateCampaignLaunchService,
  ],
  exports: [
    CampaignCreationService,
    CampaignQueryService,
    InfluencerCampaignQueryService,
    ApplicationsModule,
    SubmissionsModule,
    TypeOrmModule,
  ],
})
export class CampaignModule {}
