import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { ReviewCampaignDto } from '../dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { computePendingMinimumDeadline } from '../utils';
import { CampaignLaunchService } from './campaign-launch.service';
import { InvitationsManagementService } from '../invitations/services/invitations-management.service';
import { CampaignReportGenerationService } from '../../reports/services/campaign-report-generation.service';
import { AdvertiserWalletTransactionService } from '../../wallet/services/advertiser/advertiser-wallet-transaction.service';

@Injectable()
export class CampaignReviewService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly notificationsService: NotificationsService,
    private readonly campaignLaunchService: CampaignLaunchService,
    private readonly invitationsManagementService: InvitationsManagementService,
    private readonly campaignReportGenerationService: CampaignReportGenerationService,
    private readonly advertiserWalletTransactionService: AdvertiserWalletTransactionService,
  ) {}

  async reviewCampaign(campaignId: string, dto: ReviewCampaignDto): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, status: CampaignStatus.PENDING_REVIEW },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة أو ليست قيد المراجعة');
    }

    if (dto.status === CampaignStatus.APPROVED) {
      await this.approveCampaign(campaign);
    } else if (dto.status === CampaignStatus.REJECTED) {
      if (!dto.rejectionReason) {
        throw new BadRequestException('سبب الرفض مطلوب');
      }
      await this.rejectCampaign(campaign, dto.rejectionReason);
    }

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  async getPendingCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { status: CampaignStatus.PENDING_REVIEW },
      relations: ['advertiser'],
      order: { submittedAt: 'ASC' },
    });
  }

  private async approveCampaign(campaign: Campaign): Promise<void> {
    await this.campaignRepository.update(campaign.id, {
      approvedAt: new Date(),
    });

    const now = new Date();
    const decision = this.campaignLaunchService.decideStatusOnApproval(campaign, now);
    const isPrivate = campaign.campaignVisibility === CampaignVisibility.PRIVATE;

    if (decision.kind === 'discarded') {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.DISCARDED,
      });
      await this.notificationsService.notify(
        campaign.advertiserId,
        'تم إلغاء حملتك',
        `تم إلغاء حملة "${campaign.name}" لأن فترة التقديم قد انتهت`,
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
      return;
    }

    await this.advertiserWalletTransactionService.generateReserveTransaction({
      advertiserId: campaign.advertiserId,
      amount: Number(campaign.budget),
      campaignId: campaign.id,
      description: 'حجز ميزانية الحملة',
    });

    if (decision.kind === 'pending-minimum-public') {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.PENDING_MINIMUM,
        pendingMinimumDeadline: computePendingMinimumDeadline(now),
      });
      await this.notificationsService.notify(
        campaign.advertiserId,
        'تمت الموافقة على حملتك',
        `تمت الموافقة على حملة "${campaign.name}"، لكن فترة التقديم قد انتهت — يرجى اتخاذ إجراء`,
        NotificationType.CAMPAIGN_PENDING_MINIMUM,
        { campaignId: campaign.id },
      );
      return;
    }

    if (isPrivate) {
      await this.invitationsManagementService.activateInvitations(
        campaign.id,
        campaign.name,
      );
    }

    if (decision.kind === 'scheduled') {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.SCHEDULED,
      });
      await this.notificationsService.notify(
        campaign.advertiserId,
        'تمت الموافقة على حملتك',
        `تمت الموافقة على حملة "${campaign.name}" وستبدأ في الموعد المحدد`,
        NotificationType.CAMPAIGN_APPROVED,
        { campaignId: campaign.id },
      );
      return;
    }

    if (decision.kind === 'implementation') {
      await this.campaignLaunchService.launchImplementation(campaign);
      await this.notificationsService.notify(
        campaign.advertiserId,
        'تمت الموافقة على حملتك',
        `تمت الموافقة على حملة "${campaign.name}" وبدأت مرحلة التنفيذ`,
        NotificationType.CAMPAIGN_APPROVED,
        { campaignId: campaign.id },
      );
      return;
    }

    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.APPROVED,
    });
    await this.notificationsService.notify(
      campaign.advertiserId,
      'تمت الموافقة على حملتك',
      `تمت الموافقة على حملة "${campaign.name}"`,
      NotificationType.CAMPAIGN_APPROVED,
      { campaignId: campaign.id },
    );
  }

  private async rejectCampaign(campaign: Campaign, rejectionReason: string): Promise<void> {
    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.REJECTED,
      rejectedAt: new Date(),
      rejectionReason,
    });

    await this.notificationsService.notify(
      campaign.advertiserId,
      'تم رفض حملتك',
      `تم رفض حملة "${campaign.name}": ${rejectionReason}`,
      NotificationType.CAMPAIGN_REJECTED,
      { campaignId: campaign.id },
    );
  }
}
