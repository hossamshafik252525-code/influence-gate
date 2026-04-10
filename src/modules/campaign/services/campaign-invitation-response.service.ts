import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import {
  CampaignStatus,
  CampaignVisibility,
  InvitationStatus,
} from '../enums';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { PrivateCampaignLaunchService } from './private-campaign-launch.service';

@Injectable()
export class CampaignInvitationResponseService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepo: Repository<CampaignInvitedInfluencer>,
    private readonly notificationsService: NotificationsService,
    private readonly privateCampaignLaunchService: PrivateCampaignLaunchService,
  ) {}

  async acceptInvitation(
    influencerId: string,
    campaignId: string,
  ): Promise<{ message: string }> {
    const { campaign, invitation } = await this.loadPending(influencerId, campaignId);

    const acceptedCount = await this.invitationRepo.count({
      where: { campaignId: campaign.id, status: InvitationStatus.ACCEPTED },
    });

    if (acceptedCount >= campaign.requiredInfluencersCount) {
      throw new BadRequestException('تم اكتمال عدد المؤثرين المطلوبين لهذه الحملة');
    }

    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepo.save(invitation);

    await this.notificationsService.notify(
      campaign.advertiserId,
      'قبول دعوة',
      `قبل المؤثر الدعوة للمشاركة في حملة ${campaign.name}`,
      NotificationType.NEW_CAMPAIGN_APPLICATION,
      { campaignId: campaign.id, invitationId: invitation.id },
    );

    const newAcceptedCount = acceptedCount + 1;
    if (newAcceptedCount >= campaign.requiredInfluencersCount) {
      await this.privateCampaignLaunchService.autoLaunch(campaign);
    }

    return { message: 'تم قبول الدعوة' };
  }

  async rejectInvitation(
    influencerId: string,
    campaignId: string,
  ): Promise<{ message: string }> {
    const { campaign, invitation } = await this.loadPending(influencerId, campaignId);

    invitation.status = InvitationStatus.REJECTED;
    await this.invitationRepo.save(invitation);

    await this.notificationsService.notify(
      campaign.advertiserId,
      'رفض دعوة',
      `رفض المؤثر الدعوة للمشاركة في حملة ${campaign.name}`,
      NotificationType.APPLICATION_REJECTED,
      { campaignId: campaign.id, invitationId: invitation.id },
    );

    return { message: 'تم رفض الدعوة' };
  }

  private async loadPending(
    influencerId: string,
    campaignId: string,
  ): Promise<{ campaign: Campaign; invitation: CampaignInvitedInfluencer }> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (campaign.campaignVisibility !== CampaignVisibility.PRIVATE) {
      throw new BadRequestException('هذه الحملة ليست حملة خاصة');
    }

    if (
      campaign.status !== CampaignStatus.APPROVED &&
      campaign.status !== CampaignStatus.PENDING_MINIMUM
    ) {
      throw new BadRequestException('لا يمكن الرد على الدعوة في هذه الحالة');
    }

    const invitation = await this.invitationRepo.findOne({
      where: { campaignId, influencerId },
    });

    if (!invitation) {
      throw new NotFoundException('لا توجد دعوة لهذه الحملة');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('تم الرد على هذه الدعوة مسبقاً');
    }

    return { campaign, invitation };
  }
}
