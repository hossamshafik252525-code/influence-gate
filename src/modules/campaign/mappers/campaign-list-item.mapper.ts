import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { ApplicationStatus } from '../enums';
import {
  NewCampaignListItem,
  MyCampaignListItem,
  InfluencerApplicationItem,
  InfluencerInvitationItem,
} from '../interfaces/influencer-campaign.interface';
import { resolveCampaignDeadline, resolveCampaignStatus } from '../utils';

export class CampaignListItemMapper {
  private static toBase(campaign: Campaign): NewCampaignListItem {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      name: campaign.name,
      description: campaign.description,
      status: resolveCampaignStatus(campaign.status),
      relevantDeadline: resolveCampaignDeadline(campaign),
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
      influencerPrice: Number(campaign.influencerPrice),
    };
  }

  static toNew(campaign: Campaign): NewCampaignListItem {
    return CampaignListItemMapper.toBase(campaign);
  }

  static toMy(campaign: Campaign): MyCampaignListItem {
    return CampaignListItemMapper.toBase(campaign);
  }

  static toApplicationItem(
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
      campaign: CampaignListItemMapper.toBase(campaign),
    };
  }

  static toInvitationItem(
    invitation: CampaignInvitedInfluencer,
    campaign: Campaign,
  ): InfluencerInvitationItem {
    return {
      id: invitation.id,
      status: invitation.status,
      createdAt: invitation.createdAt,
      campaign: CampaignListItemMapper.toBase(campaign),
    };
  }
}
