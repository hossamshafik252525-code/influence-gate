import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignInvitationService } from '../entities/campaign-invitation-service.entity';
import { CampaignStatus, InvitationStatus } from '../enums';
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

  async launchOnApproval(campaign: Campaign): Promise<void> {
    const implementationStartDate = new Date();
    const implementationEndDate = new Date();
    implementationEndDate.setDate(
      implementationEndDate.getDate() + campaign.implementationPeriodDays,
    );

    const { budget, influencerPrice } = await this.computePendingBudget(campaign.id);

    await this.campaignRepo.update(campaign.id, {
      status: CampaignStatus.IMPLEMENTATION,
      implementationStartDate,
      implementationEndDate,
      pendingMinimumDeadline: null,
      budget,
      influencerPrice,
    });

    await this.notifyInvitedInfluencers(campaign);
  }

  private async computePendingBudget(
    campaignId: string,
  ): Promise<{ budget: number; influencerPrice: number }> {
    const invitations = await this.invitationRepo.find({
      where: { campaignId, status: InvitationStatus.PENDING },
    });

    if (invitations.length === 0) {
      return { budget: 0, influencerPrice: 0 };
    }

    const invitationIds = invitations.map((i) => i.id);
    const rows = await this.invitationServiceRepo.find({
      where: { invitationId: In(invitationIds) },
    });

    const total = rows.reduce((sum, row) => sum + Number(row.priceWithFee), 0);
    const budget = Math.round(total * 100) / 100;
    const influencerPrice =
      Math.round((budget / invitations.length) * 100) / 100;

    return { budget, influencerPrice };
  }

  private async notifyInvitedInfluencers(campaign: Campaign): Promise<void> {
    const invitations = await this.invitationRepo.find({
      where: { campaignId: campaign.id, status: InvitationStatus.PENDING },
    });

    for (const invitation of invitations) {
      await this.notificationsService.notify(
        invitation.influencerId,
        'دعوة للمشاركة في حملة',
        `تمت دعوتك للمشاركة في حملة "${campaign.name}"`,
        NotificationType.CAMPAIGN_INVITATION,
        { campaignId: campaign.id, invitationId: invitation.id },
      );
    }
  }
}
