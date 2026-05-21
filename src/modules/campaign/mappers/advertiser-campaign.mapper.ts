import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignVisibility } from '../enums';
import {
  AdvertiserCampaignListItem,
  AdvertiserCampaignDetail,
  AdvertiserInvitedInfluencerItem,
} from '../interfaces/advertiser-campaign.interface';

export class AdvertiserCampaignMapper {
  static toCampaignListItem(campaign: Campaign): AdvertiserCampaignListItem {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      status: campaign.status,
      currentStep: campaign.currentStep,
      name: campaign.name ?? null,
      categories: (campaign.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
      includedPlatforms: campaign.includedPlatforms ?? null,
      startDate: campaign.startDate ?? null,
      endDate: campaign.endDate ?? null,
      applicationDeadlineDate: campaign.applicationDeadlineDate ?? null,
      budget: campaign.budget ? Number(campaign.budget) : null,
      createdAt: campaign.createdAt,
    };
  }

  static toCampaignDetail(campaign: Campaign): AdvertiserCampaignDetail {
    const isPrivate = campaign.campaignVisibility === CampaignVisibility.PRIVATE;
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      status: campaign.status,
      currentStep: campaign.currentStep,
      name: campaign.name ?? null,
      description: campaign.description ?? null,
      categories: (campaign.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
      includedPlatforms: campaign.includedPlatforms ?? null,
      implementationType: campaign.implementationType ?? null,
      campaignVisibility: campaign.campaignVisibility ?? null,
      startDate: campaign.startDate ?? null,
      endDate: campaign.endDate ?? null,
      applicationDeadlineDate: campaign.applicationDeadlineDate ?? null,
      contentTypes: campaign.contentTypes ?? null,
      contentDescription: campaign.contentDescription ?? null,
      contentPdfUrl: campaign.contentPdfUrl ?? null,
      influencerType: campaign.influencerType ?? null,
      requiredInfluencersCount: campaign.requiredInfluencersCount ?? null,
      invitedInfluencers: isPrivate
        ? (campaign.invitedInfluencers ?? []).map(
            AdvertiserCampaignMapper.toInvitedInfluencerItem,
          )
        : null,
      budget: campaign.budget ? Number(campaign.budget) : null,
    };
  }

  private static toInvitedInfluencerItem(
    inv: CampaignInvitedInfluencer,
  ): AdvertiserInvitedInfluencerItem {
    const profile = inv.influencer?.influencerProfile;
    return {
      id: inv.id,
      influencerId: inv.influencerId,
      status: inv.status,
      price: Number(inv.priceWithFee),
      profileImageUrl: profile?.profileImageUrl ?? null,
      rating: profile ? Number(profile.rating) : 0,
      completedCampaignsCount: profile?.completedCampaignsCount ?? 0,
      implementationType: profile?.implementationType,
      contentType: profile?.contentType,
      description: profile?.description,
      implementationPeriodDays: profile?.implementationPeriodDays,
      includedPlatforms: profile?.includedPlatforms,
    };
  }
}
