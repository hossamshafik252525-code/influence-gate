import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignInvitationService } from '../entities/campaign-invitation-service.entity';
import {
  CampaignStatus,
  CampaignVisibility,
  InvitationStatus,
} from '../enums';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';

@Injectable()
export class PrivateCampaignLaunchService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepo: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(CampaignInvitationService)
    private readonly invitationServiceRepo: Repository<CampaignInvitationService>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async autoLaunch(campaign: Campaign): Promise<void> {
    await this.launch(campaign);
  }

  async manualLaunch(campaignId: string, advertiserId: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, advertiserId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (campaign.campaignVisibility !== CampaignVisibility.PRIVATE) {
      throw new BadRequestException('هذا الإجراء متاح للحملات الخاصة فقط');
    }

    if (
      campaign.status !== CampaignStatus.APPROVED &&
      campaign.status !== CampaignStatus.PENDING_MINIMUM
    ) {
      throw new BadRequestException('لا يمكن إطلاق الحملة في هذه الحالة');
    }

    const acceptedCount = await this.invitationRepo.count({
      where: { campaignId: campaign.id, status: InvitationStatus.ACCEPTED },
    });

    if (acceptedCount === 0) {
      throw new BadRequestException(
        'لا يمكن إطلاق الحملة بدون مؤثر مقبول واحد على الأقل',
      );
    }

    await this.launch(campaign);
    return this.campaignRepo.findOne({ where: { id: campaign.id } });
  }

  async launch(campaign: Campaign): Promise<void> {
    const implementationStartDate = new Date();
    const implementationEndDate = new Date();
    implementationEndDate.setDate(
      implementationEndDate.getDate() + campaign.implementationPeriodDays,
    );

    const { budget, influencerPrice } = await this.computeFinalBudget(campaign.id);

    await this.campaignRepo.update(campaign.id, {
      status: CampaignStatus.IMPLEMENTATION,
      implementationStartDate,
      implementationEndDate,
      pendingMinimumDeadline: null,
      budget,
      influencerPrice,
    });

    await this.cancelPendingInvitations(campaign);
    await this.notifyAcceptedInfluencers(campaign);
  }

  private async computeFinalBudget(
    campaignId: string,
  ): Promise<{ budget: number; influencerPrice: number }> {
    const acceptedInvitations = await this.invitationRepo.find({
      where: { campaignId, status: InvitationStatus.ACCEPTED },
    });

    if (acceptedInvitations.length === 0) {
      return { budget: 0, influencerPrice: 0 };
    }

    const invitationIds = acceptedInvitations.map((i) => i.id);
    const rows = await this.invitationServiceRepo.find({
      where: { invitationId: In(invitationIds) },
    });

    const total = rows.reduce((sum, row) => sum + Number(row.priceWithFee), 0);
    const budget = Math.round(total * 100) / 100;
    const influencerPrice =
      Math.round((budget / acceptedInvitations.length) * 100) / 100;

    return { budget, influencerPrice };
  }

  private async cancelPendingInvitations(campaign: Campaign): Promise<void> {
    const pending = await this.invitationRepo.find({
      where: { campaignId: campaign.id, status: InvitationStatus.PENDING },
    });

    for (const invitation of pending) {
      invitation.status = InvitationStatus.CANCELLED;
      await this.invitationRepo.save(invitation);

      await this.notificationsService.notify(
        invitation.influencerId,
        'تم إلغاء الدعوة',
        `تم إلغاء دعوتك للمشاركة في حملة ${campaign.name}`,
        NotificationType.APPLICATION_REJECTED,
        { campaignId: campaign.id, invitationId: invitation.id },
      );
    }
  }

  private async notifyAcceptedInfluencers(campaign: Campaign): Promise<void> {
    const accepted = await this.invitationRepo.find({
      where: { campaignId: campaign.id, status: InvitationStatus.ACCEPTED },
    });

    for (const invitation of accepted) {
      await this.notificationsService.notify(
        invitation.influencerId,
        'بدأت الحملة',
        `بدأت فترة التنفيذ للحملة ${campaign.name}`,
        NotificationType.CAMPAIGN_STARTED,
        { campaignId: campaign.id },
      );
    }
  }
}
