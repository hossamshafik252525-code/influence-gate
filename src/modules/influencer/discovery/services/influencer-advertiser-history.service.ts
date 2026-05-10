import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignApplication } from '../../../campaign/applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../../../campaign/invitations/entities/campaign-invited-influencer.entity';
import { CampaignStatus } from '../../../campaign/enums';
import { ApplicationStatus } from '../../../campaign/applications/enums';
import { InvitationStatus } from '../../../campaign/invitations/enums';

@Injectable()
export class InfluencerAdvertiserHistoryService {
  constructor(
    @InjectRepository(CampaignApplication)
    private readonly campaignApplicationRepo: Repository<CampaignApplication>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitedInfluencerRepo: Repository<CampaignInvitedInfluencer>,
  ) {}

  async hasCompletedCampaignWith(influencerId: string, advertiserId: string): Promise<boolean> {
    const acceptedApplication = await this.campaignApplicationRepo
      .createQueryBuilder('app')
      .innerJoin('app.campaign', 'campaign')
      .where('app.influencerId = :influencerId', { influencerId })
      .andWhere('app.status = :appStatus', { appStatus: ApplicationStatus.ACCEPTED })
      .andWhere('campaign.advertiserId = :advertiserId', { advertiserId })
      .andWhere('campaign.status = :campaignStatus', {
        campaignStatus: CampaignStatus.COMPLETED,
      })
      .getCount();

    if (acceptedApplication > 0) {
      return true;
    }

    const acceptedInvitation = await this.invitedInfluencerRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.campaign', 'campaign')
      .where('inv.influencerId = :influencerId', { influencerId })
      .andWhere('inv.status = :invStatus', { invStatus: InvitationStatus.ACCEPTED })
      .andWhere('campaign.advertiserId = :advertiserId', { advertiserId })
      .andWhere('campaign.status = :campaignStatus', {
        campaignStatus: CampaignStatus.COMPLETED,
      })
      .getCount();

    return acceptedInvitation > 0;
  }
}
