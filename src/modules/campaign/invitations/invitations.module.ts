import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from './entities/campaign-invited-influencer.entity';
import { CampaignInvitationService } from './entities/campaign-invitation-service.entity';
import { InfluencerInvitationController } from './controllers/influencer-invitation.controller';
import { CampaignInvitationResponseService } from './services/campaign-invitation-response.service';
import { NotificationsModule } from '../../notifications/notifications.module';
import { CampaignModule } from '../campaign.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignInvitedInfluencer,
      CampaignInvitationService,
    ]),
    NotificationsModule,
    forwardRef(() => CampaignModule),
  ],
  controllers: [InfluencerInvitationController],
  providers: [CampaignInvitationResponseService],
  exports: [CampaignInvitationResponseService, TypeOrmModule],
})
export class InvitationsModule {}
