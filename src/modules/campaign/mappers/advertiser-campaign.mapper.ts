import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { Category } from '../../categories/entities/category.entity';
import { CampaignVisibility } from '../enums';
import {
  AdvertiserCampaignListItem,
  AdvertiserCampaignDetail,
  AdvertiserInvitedInfluencerItem,
} from '../interfaces/advertiser-campaign.interface';

export class AdvertiserCampaignMapper {
  static toCampaignListItem(
    campaign: Campaign,
    allCategories: Category[],
  ): AdvertiserCampaignListItem {
    const categoryIds = campaign.categoryIds ?? [];
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      status: campaign.status,
      currentStep: campaign.currentStep,
      name: campaign.name ?? null,
      categories: allCategories
        .filter((c) => categoryIds.includes(c.id))
        .map((c) => ({ id: c.id, name: c.name })),
      includedPlatforms: campaign.includedPlatforms ?? null,
      deadlineDate: campaign.deadlineDate ?? null,
      budget: campaign.budget ? Number(campaign.budget) : null,
      implementationStartDate: campaign.implementationStartDate ?? null,
      implementationEndDate: campaign.implementationEndDate ?? null,
      createdAt: campaign.createdAt,
    };
  }

  static toCampaignDetail(
    campaign: Campaign,
    allCategories: Category[],
  ): AdvertiserCampaignDetail {
    const categoryIds = campaign.categoryIds ?? [];
    const isPrivate = campaign.campaignVisibility === CampaignVisibility.PRIVATE;
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      status: campaign.status,
      currentStep: campaign.currentStep,
      name: campaign.name ?? null,
      description: campaign.description ?? null,
      categories: allCategories
        .filter((c) => categoryIds.includes(c.id))
        .map((c) => ({ id: c.id, name: c.name })),
      includedPlatforms: campaign.includedPlatforms ?? null,
      implementationType: campaign.implementationType ?? null,
      campaignVisibility: campaign.campaignVisibility ?? null,
      deadlineDate: campaign.deadlineDate ?? null,
      implementationPeriodDays: campaign.implementationPeriodDays ?? null,
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
