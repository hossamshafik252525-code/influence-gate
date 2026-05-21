import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { InvitationStatus } from '../enums';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { NotificationType } from '../../../notifications/enums';
import { InvitationsValidationService } from './invitations-validation.service';

@Injectable()
export class CampaignInvitationResponseService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepo: Repository<CampaignInvitedInfluencer>,
    private readonly notificationsService: NotificationsService,
    private readonly invitationsValidationService: InvitationsValidationService,
  ) {}

  async acceptInvitation(
    influencerId: string,
    invitationId: string,
  ): Promise<{ message: string }> {
    const { campaign, invitation } = await this.loadPending(influencerId, invitationId);

    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepo.save(invitation);

    await this.notificationsService.notify(
      campaign.advertiserId,
      'قبول دعوة',
      `قبل المؤثر الدعوة للمشاركة في حملة ${campaign.name}`,
      NotificationType.NEW_CAMPAIGN_APPLICATION,
      { campaignId: campaign.id, invitationId: invitation.id },
    );

    return { message: 'تم قبول الدعوة' };
  }

  async rejectInvitation(
    influencerId: string,
    invitationId: string,
  ): Promise<{ message: string }> {
    const { campaign, invitation } = await this.loadPending(influencerId, invitationId);

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
    invitationId: string,
  ): Promise<{ campaign: Campaign; invitation: CampaignInvitedInfluencer }> {
    const invitation =
      await this.invitationsValidationService.assertPendingInvitationForInfluencer(
        invitationId,
        influencerId,
      );

    const campaign = await this.campaignRepo.findOne({
      where: { id: invitation.campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    this.invitationsValidationService.assertCampaignAcceptingInvitationResponses(campaign);

    return { campaign, invitation };
  }
}
