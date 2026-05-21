import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import {
  isAfterApplicationDeadline,
  isBeforeStart,
  isInApplicationWindow,
} from '../utils';
import { InvitationsManagementService } from '../invitations/services/invitations-management.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { ApplicationStatus } from '../applications/enums';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';

export type ApprovalDecision =
  | { kind: 'discarded' }
  | { kind: 'scheduled' }
  | { kind: 'implementation' }
  | { kind: 'approved-public' }
  | { kind: 'pending-minimum-public' };

@Injectable()
export class CampaignLaunchService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    private readonly invitationsManagementService: InvitationsManagementService,
    private readonly notificationsService: NotificationsService,
  ) {}

  decideStatusOnApproval(campaign: Campaign, now: Date): ApprovalDecision {
    const isPrivate = campaign.campaignVisibility === CampaignVisibility.PRIVATE;

    if (isAfterApplicationDeadline(campaign, now)) {
      return isPrivate ? { kind: 'discarded' } : { kind: 'pending-minimum-public' };
    }

    if (isBeforeStart(campaign, now)) {
      return { kind: 'scheduled' };
    }

    if (isInApplicationWindow(campaign, now)) {
      return isPrivate ? { kind: 'implementation' } : { kind: 'approved-public' };
    }

    return isPrivate ? { kind: 'implementation' } : { kind: 'approved-public' };
  }

  async launchImplementation(campaign: Campaign): Promise<void> {
    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.IMPLEMENTATION,
      pendingMinimumDeadline: null,
    });

    if (campaign.campaignVisibility === CampaignVisibility.PUBLIC) {
      await this.rejectPendingApplications(campaign);
    }
  }

  async discardWithCancelInvitations(campaign: Campaign): Promise<void> {
    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.DISCARDED,
      pendingMinimumDeadline: null,
    });

    await this.invitationsManagementService.cancelPendingByCampaign(
      campaign.id,
      campaign.name,
    );

    await this.notificationsService.notify(
      campaign.advertiserId,
      'تم إلغاء حملتك',
      `تم إلغاء حملة "${campaign.name}" بسبب عدم استجابة المؤثرين خلال الفترة المحددة`,
      NotificationType.CAMPAIGN_AUTO_DISCARDED,
      { campaignId: campaign.id },
    );
  }

  private async rejectPendingApplications(campaign: Campaign): Promise<void> {
    const pendingApplications = await this.applicationRepository.find({
      where: { campaignId: campaign.id, status: ApplicationStatus.PENDING },
    });

    for (const pending of pendingApplications) {
      pending.status = ApplicationStatus.REJECTED;
      await this.applicationRepository.save(pending);

      await this.notificationsService.notify(
        pending.influencerId,
        'تم رفض طلبك',
        `تم رفض طلبك للحملة ${campaign.name} لاكتمال العدد المطلوب`,
        NotificationType.APPLICATION_REJECTED,
        { campaignId: campaign.id, applicationId: pending.id },
      );
    }

    const acceptedApplications = await this.applicationRepository.find({
      where: { campaignId: campaign.id, status: ApplicationStatus.ACCEPTED },
    });

    for (const accepted of acceptedApplications) {
      await this.notificationsService.notify(
        accepted.influencerId,
        'بدأت الحملة',
        `بدأت فترة التنفيذ للحملة ${campaign.name}`,
        NotificationType.CAMPAIGN_STARTED,
        { campaignId: campaign.id },
      );
    }
  }
}
