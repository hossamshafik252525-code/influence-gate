import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { Campaign } from '../../entities/campaign.entity';
import { InfluencerInvitationItem } from '../interfaces';
import { InfluencerCampaignMapper } from '../../mappers/influencer-campaign.mapper';

export class InfluencerInvitationMapper {
  static toInvitationListItem(
    invitation: CampaignInvitedInfluencer,
    campaign: Campaign,
  ): InfluencerInvitationItem {
    return {
      id: invitation.id,
      status: invitation.status,
      createdAt: invitation.createdAt,
      campaign: InfluencerCampaignMapper.toCampaignListItemBase(campaign),
    };
  }
}
