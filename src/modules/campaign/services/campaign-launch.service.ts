import { BadRequestException, Injectable } from '@nestjs/common';
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
import { ApplicationsValidationService } from '../applications/services/applications-validation.service';
import { ApplicationsManagementService } from '../applications/services/applications-management.service';
import { CampaignReportGenerationService } from '../../reports/services/campaign-report-generation.service';
import { CampaignQueryService } from './campaign-query.service';

const LAUNCHABLE_STATUSES = [
  CampaignStatus.APPROVED,
  CampaignStatus.PENDING_MINIMUM,
];

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
    private readonly invitationsManagementService: InvitationsManagementService,
    private readonly notificationsService: NotificationsService,
    private readonly campaignReportGenerationService: CampaignReportGenerationService,
    private readonly campaignQueryService: CampaignQueryService,
    private readonly applicationsValidationService: ApplicationsValidationService,
    private readonly applicationsManagementService: ApplicationsManagementService,
  ) {}

  async launchOnDemand(
    campaignId: string,
    advertiserId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignQueryService.findCampaignWithRelations(
      campaignId,
      advertiserId,
    );

    if (!LAUNCHABLE_STATUSES.includes(campaign.status)) {
      throw new BadRequestException('لا يمكن إطلاق الحملة في هذه الحالة');
    }

    await this.applicationsValidationService.ensureCampaignHasAcceptedApplication(
      campaign.id,
    );

    await this.launchImplementation(campaign);

    return this.campaignQueryService.findCampaignWithRelations(
      campaignId,
      advertiserId,
    );
  }

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
      await this.applicationsManagementService.rejectPendingApplicationsForCampaign(
        campaign,
      );
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
