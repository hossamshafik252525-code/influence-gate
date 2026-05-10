import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignSubmission } from './entities/campaign-submission.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import { InfluencerSubmissionController } from './controllers/influencer-submission.controller';
import { AdvertiserSubmissionController } from './controllers/advertiser-submission.controller';
import { CampaignContentSubmissionService } from './services/campaign-content-submission.service';
import { CampaignSubmissionReviewService } from './services/campaign-submission-review.service';
import { CampaignSubmissionQueryService } from './services/campaign-submission-query.service';
import { CampaignSubmissionDataService } from './services/campaign-submission-data.service';
import { NotificationsModule } from '../../notifications/notifications.module';
import { WalletModule } from '../../wallet/wallet.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignSubmission,
      CampaignApplication,
      CampaignInvitedInfluencer,
      InfluencerProfile,
    ]),
    NotificationsModule,
    WalletModule,
    forwardRef(() => ApplicationsModule),
  ],
  controllers: [InfluencerSubmissionController, AdvertiserSubmissionController],
  providers: [
    CampaignContentSubmissionService,
    CampaignSubmissionReviewService,
    CampaignSubmissionQueryService,
    CampaignSubmissionDataService,
  ],
  exports: [
    CampaignContentSubmissionService,
    CampaignSubmissionReviewService,
    CampaignSubmissionQueryService,
    CampaignSubmissionDataService,
    TypeOrmModule,
  ],
})
export class SubmissionsModule {}
