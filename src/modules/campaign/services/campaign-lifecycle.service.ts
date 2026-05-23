import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { computePendingMinimumDeadline } from '../utils';
import { CampaignLaunchService } from './campaign-launch.service';
import { CampaignCompletionService } from './campaign-completion.service';
import { InvitationsDataService } from '../invitations/services/invitations-data.service';
import { ApplicationsDataService } from '../applications/services/applications-data.service';
import { CampaignReportGenerationService } from '../../reports/services/campaign-report-generation.service';

@Injectable()
export class CampaignLifecycleService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly notificationsService: NotificationsService,
    private readonly campaignLaunchService: CampaignLaunchService,
    private readonly campaignCompletionService: CampaignCompletionService,
    private readonly invitationsDataService: InvitationsDataService,
    private readonly applicationsDataService: ApplicationsDataService,
    private readonly campaignReportGenerationService: CampaignReportGenerationService,
  ) {}

  @Cron('0 0 * * *')
  async processScheduledStarts(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.SCHEDULED,
        startDate: LessThanOrEqual(today),
      },
    });

    for (const campaign of campaigns) {
      if (campaign.campaignVisibility === CampaignVisibility.PRIVATE) {
        await this.campaignLaunchService.launchImplementation(campaign);
      } else {
        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.APPROVED,
        });
      }
    }
  }

  @Cron('0 0 * * *')
  async processApplicationDeadlines(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaigns = await this.campaignRepository.find({
      where: { applicationDeadlineDate: LessThanOrEqual(today) },
    });

    for (const campaign of campaigns) {
      if (
        campaign.campaignVisibility === CampaignVisibility.PRIVATE &&
        campaign.status === CampaignStatus.IMPLEMENTATION
      ) {
        const hasAccepted =
          await this.invitationsDataService.hasAcceptedInvitation(campaign.id);
        if (!hasAccepted) {
          await this.campaignLaunchService.discardWithCancelInvitations(campaign);
        }
        continue;
      }

      if (
        campaign.campaignVisibility === CampaignVisibility.PUBLIC &&
        campaign.status === CampaignStatus.APPROVED
      ) {
        const acceptedCount =
          await this.applicationsDataService.countAcceptedApplications(campaign.id);

        if (acceptedCount >= (campaign.requiredInfluencersCount || 0)) {
          await this.campaignLaunchService.launchImplementation(campaign);
          continue;
        }

        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.PENDING_MINIMUM,
          pendingMinimumDeadline: computePendingMinimumDeadline(new Date()),
        });

        await this.notificationsService.notify(
          campaign.advertiserId,
          'انتهت فترة التقديم لحملتك',
          `انتهت فترة التقديم لحملة ${campaign.name}. يرجى اتخاذ إجراء`,
          NotificationType.CAMPAIGN_PENDING_MINIMUM,
          { campaignId: campaign.id },
        );
      }
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

      const updated = await this.campaignRepository.findOne({
        where: { id: campaign.id },
      });
      if (updated) {
        await this.campaignReportGenerationService.generateForDiscardedCampaign(
          updated,
        );
      }
    }
  }

  @Cron('0 1 * * *')
  async processImplementationCompletion(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.IMPLEMENTATION,
        endDate: LessThanOrEqual(today),
      },
    });

    for (const campaign of campaigns) {
      await this.campaignCompletionService.markCompleted(campaign);
    }
  }
}
