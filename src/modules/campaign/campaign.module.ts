import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignInvitedInfluencer } from './entities/campaign-invited-influencer.entity';
import { CampaignInvitationService } from './entities/campaign-invitation-service.entity';
import { CampaignApplication } from './entities/campaign-application.entity';
import { CampaignSubmission } from './entities/campaign-submission.entity';
import { AdvertiserCampaignController } from './controllers/advertiser-campaign.controller';
import { AdminCampaignController } from './controllers/admin-campaign.controller';
import { InfluencerCampaignController } from './controllers/influencer-campaign.controller';
import { CampaignCreationService } from './services/campaign-creation.service';
import { CampaignSubmissionService } from './services/campaign-submission.service';
import { CampaignReviewService } from './services/campaign-review.service';
import { CampaignLifecycleService } from './services/campaign-lifecycle.service';
import { CampaignQueryService } from './services/campaign-query.service';
import { InfluencerCampaignQueryService } from './services/influencer-campaign-query.service';
import { CampaignApplicationService } from './services/campaign-application.service';
import { CampaignApplicationReviewService } from './services/campaign-application-review.service';
import { CampaignContentSubmissionService } from './services/campaign-content-submission.service';
import { CampaignSubmissionReviewService } from './services/campaign-submission-review.service';
import { CampaignSubmissionQueryService } from './services/campaign-submission-query.service';
import { CampaignInvitationResponseService } from './services/campaign-invitation-response.service';
import { CampaignApplicationWithdrawalService } from './services/campaign-application-withdrawal.service';
import { PrivateCampaignLaunchService } from './services/private-campaign-launch.service';
import { CampaignSubmissionDataService } from './services/campaign-submission-data.service';
import { InfluencerProfile } from '../influencer/entities/influencer-profile.entity';
import { InfluencerService as InfluencerServiceEntity } from '../influencer/entities/influencer-service.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignInvitedInfluencer,
      CampaignInvitationService,
      CampaignApplication,
      CampaignSubmission,
      InfluencerProfile,
      InfluencerServiceEntity,
    ]),
    NotificationsModule,
    CloudinaryModule,
    CategoriesModule,
    UsersModule,
    PlatformSettingsModule,
    WalletModule,
  ],
  controllers: [AdvertiserCampaignController, AdminCampaignController, InfluencerCampaignController],
  providers: [
    CampaignCreationService,
    CampaignSubmissionService,
    CampaignReviewService,
    CampaignLifecycleService,
    CampaignQueryService,
    InfluencerCampaignQueryService,
    CampaignApplicationService,
    CampaignApplicationReviewService,
    CampaignContentSubmissionService,
    CampaignSubmissionReviewService,
    CampaignSubmissionQueryService,
    CampaignInvitationResponseService,
    CampaignApplicationWithdrawalService,
    PrivateCampaignLaunchService,
    CampaignSubmissionDataService,
  ],
  exports: [CampaignCreationService, CampaignQueryService, CampaignSubmissionDataService, TypeOrmModule],
})
export class CampaignModule {}
