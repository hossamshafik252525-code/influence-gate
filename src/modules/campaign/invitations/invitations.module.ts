import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from './entities/campaign-invited-influencer.entity';

import { InfluencerInvitationController } from './controllers/influencer-invitation.controller';
import { CampaignInvitationResponseService } from './services/campaign-invitation-response.service';
import { InvitationsManagementService } from './services/invitations-management.service';
import { InfluencerInvitationQueryService } from './services/influencer-invitation-query.service';
import { NotificationsModule } from '../../notifications/notifications.module';
import { CampaignModule } from '../campaign.module';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import { UsersModule } from '../../users/users.module';
import { PlatformSettingsModule } from '../../platform-settings/platform-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignInvitedInfluencer,
      InfluencerProfile,
    ]),
    NotificationsModule,
    UsersModule,
    PlatformSettingsModule,
    forwardRef(() => CampaignModule),
  ],
  controllers: [InfluencerInvitationController],
  providers: [
    CampaignInvitationResponseService,
    InvitationsManagementService,
    InfluencerInvitationQueryService,
  ],
  exports: [
    CampaignInvitationResponseService,
    InvitationsManagementService,
    InfluencerInvitationQueryService,
    TypeOrmModule,
  ],
})
export class InvitationsModule {}
