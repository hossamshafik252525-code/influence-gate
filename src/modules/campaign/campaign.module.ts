import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignInvitedInfluencer } from './invitations/entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from './submissions/entities/campaign-submission.entity';
import { CampaignApplication } from './applications/entities/campaign-application.entity';
import { AdvertiserCampaignController } from './controllers/advertiser-campaign.controller';
import { AdminCampaignController } from './controllers/admin-campaign.controller';
import { InfluencerCampaignController } from './controllers/influencer-campaign.controller';
import { CampaignCreationService } from './services/campaign-creation.service';
import { CampaignManagementService } from './services/campaign-management.service';
import { CampaignReviewService } from './services/campaign-review.service';
import { CampaignLifecycleService } from './services/campaign-lifecycle.service';
import { CampaignQueryService } from './services/campaign-query.service';
import { CampaignValidationService } from './services/campaign-validation.service';
import { CampaignDraftService } from './services/campaign-draft.service';
import { CampaignLaunchService } from './services/campaign-launch.service';
import { CampaignCompletionService } from './services/campaign-completion.service';
import { CampaignRepository } from './repositories';
import { InfluencerModule } from '../influencer/influencer.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CategoriesModule } from '../categories/categories.module';
import { CountriesModule } from '../countries/countries.module';
import { UsersModule } from '../users/users.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { WalletModule } from '../wallet/wallet.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ApplicationsModule } from './applications/applications.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignInvitedInfluencer,
      CampaignSubmission,
      CampaignApplication,
    ]),
    forwardRef(() => InvitationsModule),
    forwardRef(() => ApplicationsModule),
    forwardRef(() => SubmissionsModule),
    InfluencerModule,
    NotificationsModule,
    CloudinaryModule,
    CategoriesModule,
    CountriesModule,
    UsersModule,
    PlatformSettingsModule,
    WalletModule,
    ReportsModule,
  ],
  controllers: [
    AdvertiserCampaignController,
    AdminCampaignController,
    InfluencerCampaignController,
  ],
  providers: [
    CampaignRepository,
    CampaignCreationService,
    CampaignManagementService,
    CampaignReviewService,
    CampaignLifecycleService,
    CampaignQueryService,
    CampaignValidationService,
    CampaignDraftService,
    CampaignLaunchService,
    CampaignCompletionService,
  ],
  exports: [
    CampaignRepository,
    CampaignCreationService,
    CampaignQueryService,
    CampaignLaunchService,
    ApplicationsModule,
    SubmissionsModule,
    TypeOrmModule,
  ],
})
export class CampaignModule {}
