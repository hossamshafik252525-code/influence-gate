import { Campaign } from '../entities/campaign.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import {
  InfluencerCampaignListItem,
  MyCampaignListItem,
} from '../interfaces/influencer-campaign.interface';

export class CampaignListItemMapper {
  static toNewCampaign(campaign: Campaign): InfluencerCampaignListItem {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      name: campaign.name,
      description: campaign.description,
      deadlineDate: campaign.deadlineDate,
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
      influencerPrice: Number(campaign.influencerPrice),
    };
  }

  static toMyCampaign(
    campaign: Campaign,
    submission: CampaignSubmission | null,
  ): MyCampaignListItem {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      name: campaign.name,
      description: campaign.description,
      deadlineDate: campaign.deadlineDate,
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
      influencerPrice: Number(campaign.influencerPrice),
      submissionStatus: submission?.status ?? null,
    };
  }
}
