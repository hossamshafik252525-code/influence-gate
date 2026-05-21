import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from './entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { AdminOfferController } from './controllers/admin-offer.controller';
import { AdvertiserApplicationController } from './controllers/advertiser-application.controller';
import { InfluencerApplicationController } from './controllers/influencer-application.controller';
import { ApplicationsManagementService } from './services/applications-management.service';
import { CampaignApplicationReviewService } from './services/campaign-application-review.service';
import { CampaignApplicationWithdrawalService } from './services/campaign-application-withdrawal.service';
import { AdminOfferQueryService } from './services/admin-offer-query.service';
import { AdminOfferReviewService } from './services/admin-offer-review.service';
import { AdvertiserApplicationQueryService } from './services/advertiser-application-query.service';
import { InfluencerApplicationQueryService } from './services/influencer-application-query.service';
import { ApplicationsValidationService } from './services/applications-validation.service';
import { ApplicationsDataService } from './services/applications-data.service';
import { NotificationsModule } from '../../notifications/notifications.module';
import { WalletModule } from '../../wallet/wallet.module';
import { CampaignModule } from '../campaign.module';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import { PlatformSettingsModule } from '../../platform-settings/platform-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignApplication,
      CampaignInvitedInfluencer,
      InfluencerProfile,
    ]),
    NotificationsModule,
    WalletModule,
    PlatformSettingsModule,
    forwardRef(() => CampaignModule),
  ],
  controllers: [
    AdminOfferController,
    AdvertiserApplicationController,
    InfluencerApplicationController,
  ],
  providers: [
    ApplicationsManagementService,
    CampaignApplicationReviewService,
    CampaignApplicationWithdrawalService,
    AdminOfferQueryService,
    AdminOfferReviewService,
    AdvertiserApplicationQueryService,
    InfluencerApplicationQueryService,
    ApplicationsValidationService,
    ApplicationsDataService,
  ],
  exports: [
    TypeOrmModule,
    AdvertiserApplicationQueryService,
    InfluencerApplicationQueryService,
    ApplicationsValidationService,
    ApplicationsDataService,
  ],
})
export class ApplicationsModule {}
