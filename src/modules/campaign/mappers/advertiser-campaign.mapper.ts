import { Campaign } from '../entities/campaign.entity';
import {
  AdvertiserCampaignResult,
  AdvertiserInvitedInfluencerItem,
  AdvertiserOrderedServiceItem,
} from '../interfaces/advertiser-campaign.interface';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignInvitationService } from '../entities/campaign-invitation-service.entity';

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
    return {
      id: inv.id,
      influencerId: inv.influencerId,
      status: inv.status,
      orderedServices: (inv.orderedServices ?? []).map(
        (os) => AdvertiserCampaignMapper.toOrderedService(os),
      ),
    };
  }

  private static toOrderedService(
    os: CampaignInvitationService,
  ): AdvertiserOrderedServiceItem {
    return {
      id: os.id,
      price: Number(os.priceWithFee),
      implementationType: os.service?.implementationType,
      contentType: os.service?.contentType,
      description: os.service?.description,
      implementationPeriodDays: os.service?.implementationPeriodDays,
      includedPlatforms: os.service?.includedPlatforms,
    };
  }
}
