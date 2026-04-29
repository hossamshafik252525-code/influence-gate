import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import {
  CampaignStatus,
  PendingMinimumAction,
  ApplicationStatus,
  CampaignVisibility,
  InvitationStatus,
  SubmissionStatus,
} from '../enums';
import { ResolvePendingMinimumDto } from '../dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { WalletTransactionService } from '../../wallet/services/wallet-transaction.service';
import { TransactionStatus } from '../../wallet/enums';

const STALE_INVITATION_THRESHOLD_RATIO = 0.75;

@Injectable()
export class CampaignLifecycleService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepository: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepository: Repository<CampaignSubmission>,
    private readonly notificationsService: NotificationsService,
    private readonly walletTransactionService: WalletTransactionService,
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
      await this.generateCancelledTransactionsForUnacceptedInfluencers(campaign);
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.COMPLETED,
      });
    }
  }

  async resolvePendingMinimum(
    campaignId: string,
    advertiserId: string,
    dto: ResolvePendingMinimumDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: {
        id: campaignId,
        advertiserId,
        status: CampaignStatus.PENDING_MINIMUM,
      },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة أو ليست في حالة انتظار');
    }

    switch (dto.action) {
      case PendingMinimumAction.EXTEND_7_DAYS: {
        const newDeadline = new Date(campaign.deadlineDate);
        newDeadline.setDate(newDeadline.getDate() + 7);

        await this.campaignRepository.update(campaign.id, {
          deadlineDate: newDeadline,
          status: CampaignStatus.APPROVED,
          pendingMinimumDeadline: null,
        });
        break;
      }

      case PendingMinimumAction.LAUNCH_ANYWAY: {
        const acceptedCount = await this.applicationRepository.count({
          where: { campaignId: campaign.id, status: ApplicationStatus.ACCEPTED },
        });

        if (acceptedCount === 0) {
          throw new BadRequestException('لا يمكن إطلاق الحملة بدون مؤثر مقبول واحد على الأقل');
        }

        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.IMPLEMENTATION,
          implementationStartDate: new Date(),
          implementationEndDate: this.calculateEndDate(campaign.implementationPeriodDays),
          pendingMinimumDeadline: null,
        });
        break;
      }

      case PendingMinimumAction.DISCARD: {
        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.DISCARDED,
          pendingMinimumDeadline: null,
        });
        break;
      }
    }

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  private async generateCancelledTransactionsForUnacceptedInfluencers(
    campaign: Campaign,
  ): Promise<void> {
    const influencerIds =
      campaign.campaignVisibility === CampaignVisibility.PUBLIC
        ? await this.getAcceptedPublicInfluencerIds(campaign.id)
        : await this.getAcceptedPrivateInfluencerIds(campaign.id);

    if (!influencerIds.length) return;

    const acceptedSubmissions = await this.submissionRepository.find({
      where: { campaignId: campaign.id, status: SubmissionStatus.ACCEPTED },
    });

    const acceptedInfluencerSet = new Set(acceptedSubmissions.map((s) => s.influencerId));

    for (const influencerId of influencerIds) {
      if (!acceptedInfluencerSet.has(influencerId)) {
        const amount =
          campaign.campaignVisibility === CampaignVisibility.PUBLIC
            ? Number(campaign.influencerPrice)
            : await this.getPrivateInfluencerPrice(campaign.id, influencerId);

        await this.walletTransactionService.createRevenueTransaction({
          influencerId,
          amount,
          campaignId: campaign.id,
          campaignName: campaign.name,
          includedPlatforms: campaign.includedPlatforms,
          status: TransactionStatus.CANCELLED,
        });
      }
    }
  }

  private async getAcceptedPublicInfluencerIds(campaignId: string): Promise<string[]> {
    const applications = await this.applicationRepository.find({
      where: { campaignId, status: ApplicationStatus.ACCEPTED },
    });
    return applications.map((a) => a.influencerId);
  }

  private async getAcceptedPrivateInfluencerIds(campaignId: string): Promise<string[]> {
    const invitations = await this.invitationRepository.find({
      where: { campaignId, status: InvitationStatus.ACCEPTED },
    });
    return invitations.map((i) => i.influencerId);
  }

  private async getPrivateInfluencerPrice(
    campaignId: string,
    influencerId: string,
  ): Promise<number> {
    const invitation = await this.invitationRepository.findOne({
      where: { campaignId, influencerId, status: InvitationStatus.ACCEPTED },
      relations: ['orderedServices'],
    });

    if (!invitation) return 0;

    return invitation.orderedServices.reduce((sum, s) => sum + Number(s.priceWithFee), 0);
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

  private calculateEndDate(periodDays: number): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + periodDays);
    return endDate;
  }
}
