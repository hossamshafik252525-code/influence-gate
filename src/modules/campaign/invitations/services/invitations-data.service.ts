import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { InvitationStatus } from '../enums';

@Injectable()
export class InvitationsDataService {
  constructor(
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepository: Repository<CampaignInvitedInfluencer>,
  ) {}

  async getAcceptedInfluencerIds(campaignId: string): Promise<string[]> {
    const invitations = await this.invitationRepository.find({
      where: { campaignId, status: InvitationStatus.ACCEPTED },
    });
    return invitations.map((i) => i.influencerId);
  }

  async getPriceForInfluencer(
    campaignId: string,
    influencerId: string,
  ): Promise<number> {
    const invitation = await this.invitationRepository.findOne({
      where: { campaignId, influencerId, status: InvitationStatus.ACCEPTED },
    });
    if (!invitation) return 0;
    return Number(invitation.priceWithFee);
  }

  async hasAcceptedInvitation(campaignId: string): Promise<boolean> {
    const count = await this.invitationRepository.count({
      where: { campaignId, status: InvitationStatus.ACCEPTED },
    });
    return count > 0;
  }

  async countPending(campaignId: string): Promise<number> {
    return this.invitationRepository.count({
      where: { campaignId, status: InvitationStatus.PENDING },
    });
  }

  async sumAllInvitationsCost(campaignId: string): Promise<number> {
    const invitations = await this.invitationRepository.find({
      where: { campaignId },
    });
    return invitations.reduce(
      (sum, invitation) => sum + Number(invitation.priceWithFee || 0),
      0,
    );
  }
}
