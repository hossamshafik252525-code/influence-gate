import { Campaign } from '../entities/campaign.entity';
import {
  AdvertiserCampaignResult,
  AdvertiserInvitedInfluencerItem,
} from '../interfaces/advertiser-campaign.interface';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';


export class AdvertiserCampaignMapper {
  static toResult(campaign: Campaign): AdvertiserCampaignResult {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      status: campaign.status,
      currentStep: campaign.currentStep,
      campaignVisibility: campaign.campaignVisibility ?? null,
      requiredInfluencersCount: campaign.requiredInfluencersCount ?? null,
      influencerType: campaign.influencerType ?? null,
      budget: campaign.budget ? Number(campaign.budget) : null,
      influencerPrice: campaign.influencerPrice ? Number(campaign.influencerPrice) : null,
      invitedInfluencers: (campaign.invitedInfluencers ?? []).map(
        (inv) => AdvertiserCampaignMapper.toInvitedInfluencer(inv),
      ),
    };
  }

  private static toInvitedInfluencer(
    inv: CampaignInvitedInfluencer,
  ): AdvertiserInvitedInfluencerItem {
    const profile = inv.influencer?.influencerProfile;
    return {
      id: inv.id,
      influencerId: inv.influencerId,
      status: inv.status,
      price: Number(inv.priceWithFee),
      implementationType: profile?.implementationType,
      contentType: profile?.contentType,
      description: profile?.description,
      implementationPeriodDays: profile?.implementationPeriodDays,
      includedPlatforms: profile?.includedPlatforms,
    };
  }
}
