import { CampaignApplication } from '../entities/campaign-application.entity';
import { Campaign } from '../../entities/campaign.entity';
import { InfluencerApplicationItem } from '../interfaces';
import { ApplicationStatus } from '../enums';
import { InfluencerCampaignMapper } from '../../mappers/influencer-campaign.mapper';

export class InfluencerApplicationMapper {
  static toApplicationListItem(
    application: CampaignApplication,
    campaign: Campaign,
  ): InfluencerApplicationItem {
    return {
      id: application.id,
      status:
        application.status === ApplicationStatus.PENDING_ADMIN_APPROVAL
          ? ApplicationStatus.PENDING
          : application.status,
      offerPrice:
        application.offerPrice === null || application.offerPrice === undefined
          ? null
          : Number(application.offerPrice),
      createdAt: application.createdAt,
      campaign: InfluencerCampaignMapper.toCampaignListItemBase(campaign),
    };
  }
}
