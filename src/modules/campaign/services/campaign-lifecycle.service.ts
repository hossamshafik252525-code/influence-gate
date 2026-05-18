import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { InvitationStatus } from '../invitations/enums';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { CampaignManagementService } from './campaign-management.service';

const STALE_INVITATION_THRESHOLD_RATIO = 0.75;

@Injectable()
export class CampaignLifecycleService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepository: Repository<CampaignInvitedInfluencer>,
    private readonly notificationsService: NotificationsService,
    private readonly campaignManagementService: CampaignManagementService,
  ) {}

  @Cron('0 0 * * *')
  async processDeadlines(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.APPROVED,
        deadlineDate: LessThanOrEqual(today),
      },
    });

    for (const campaign of campaigns) {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.PENDING_MINIMUM,
        pendingMinimumDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await this.notificationsService.notify(
        campaign.advertiserId,
        'انتهى الموعد النهائي لحملتك',
        `انتهى الموعد النهائي لحملة ${campaign.name}. يرجى اتخاذ إجراء`,
        NotificationType.CAMPAIGN_PENDING_MINIMUM,
        { campaignId: campaign.id },
      );
    }
  }

  @Cron('0 */6 * * *')
  async processGracePeriodExpirations(): Promise<void> {
    const now = new Date();

    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.PENDING_MINIMUM,
        pendingMinimumDeadline: LessThanOrEqual(now),
      },
    });

    for (const campaign of campaigns) {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.DISCARDED,
      });

      await this.notificationsService.notify(
        campaign.advertiserId,
        'تم إلغاء حملتك',
        `تم إلغاء حملة ${campaign.name} تلقائياً لعدم اتخاذ إجراء`,
        NotificationType.CAMPAIGN_AUTO_DISCARDED,
        { campaignId: campaign.id },
      );
    }
  }

  @Cron('0 2 * * *')
  async cancelStalePrivateInvitations(): Promise<void> {
    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.IMPLEMENTATION,
        campaignVisibility: CampaignVisibility.PRIVATE,
      },
    });

    const now = Date.now();

    for (const campaign of campaigns) {
      if (!campaign.implementationStartDate || !campaign.implementationPeriodDays) {
        continue;
      }

      const elapsedMs = now - new Date(campaign.implementationStartDate).getTime();
      const thresholdMs =
        campaign.implementationPeriodDays *
        24 *
        60 *
        60 *
        1000 *
        STALE_INVITATION_THRESHOLD_RATIO;

      if (elapsedMs < thresholdMs) {
        continue;
      }

      await this.cancelPendingInvitationsForCampaign(campaign);
    }
  }

  @Cron('0 1 * * *')
  async processImplementationCompletion(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.IMPLEMENTATION,
        implementationEndDate: LessThanOrEqual(today),
      },
    });

    for (const campaign of campaigns) {
      await this.campaignManagementService.generateCancelledTransactionsForUnacceptedInfluencers(campaign);
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.COMPLETED,
      });
    }
  }

  private async cancelPendingInvitationsForCampaign(campaign: Campaign): Promise<void> {
    const pending = await this.invitationRepository.find({
      where: { campaignId: campaign.id, status: InvitationStatus.PENDING },
    });

    for (const invitation of pending) {
      invitation.status = InvitationStatus.CANCELLED;
      await this.invitationRepository.save(invitation);

      await this.notificationsService.notify(
        invitation.influencerId,
        'تم إلغاء الدعوة',
        `تم إلغاء دعوتك للمشاركة في حملة ${campaign.name}`,
        NotificationType.APPLICATION_REJECTED,
        { campaignId: campaign.id, invitationId: invitation.id },
      );
    }
  }

}
