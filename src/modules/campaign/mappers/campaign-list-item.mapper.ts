import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import {
  NewCampaignListItem,
  CurrentCampaignListItem,
  ApplicationCampaignListItem,
  InvitationCampaignListItem,
  InvitationCampaignListItemBase,
} from '../interfaces/influencer-campaign.interface';
import { resolveCampaignDeadline } from '../utils';

export class CampaignListItemMapper {
  private static toBase(campaign: Campaign): NewCampaignListItem {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      name: campaign.name,
      description: campaign.description,
      relevantDeadline: resolveCampaignDeadline(campaign),
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
      influencerPrice: Number(campaign.influencerPrice),
    };
  }

  private static toInvitationBase(campaign: Campaign): InvitationCampaignListItemBase {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      name: campaign.name,
      description: campaign.description,
      relevantDeadline: resolveCampaignDeadline(campaign),
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
    };
  }

  static toNew(campaign: Campaign): NewCampaignListItem {
    return CampaignListItemMapper.toBase(campaign);
  }

  static toCurrent(
    campaign: Campaign,
    submission: CampaignSubmission | null,
  ): CurrentCampaignListItem {
    return {
      ...CampaignListItemMapper.toBase(campaign),
      submissionStatus: submission?.status ?? null,
    };
  }

  static toApplication(
    campaign: Campaign,
    application: CampaignApplication,
  ): ApplicationCampaignListItem {
    return {
      ...CampaignListItemMapper.toBase(campaign),
      application: { id: application.id, status: application.status },
    };
  }

  static toInvitation(
    campaign: Campaign,
    invitation: CampaignInvitedInfluencer,
  ): InvitationCampaignListItem {
    return {
      ...CampaignListItemMapper.toInvitationBase(campaign),
      invitation: { id: invitation.id, status: invitation.status },
    };
  }
}
