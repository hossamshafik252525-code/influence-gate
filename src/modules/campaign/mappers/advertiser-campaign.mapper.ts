import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignVisibility } from '../enums';
import {
  AdvertiserCampaignListItem,
  AdvertiserCampaignDetail,
  AdvertiserInvitedInfluencerItem,
  NamedRelationItem,
} from '../interfaces/advertiser-campaign.interface';
import { ContentType } from '../../content-types/entities/content-type.entity';
import { ImplementationType } from '../../implementation-types/entities/implementation-type.entity';

export class AdvertiserCampaignMapper {
  static toCampaignListItem(campaign: Campaign): AdvertiserCampaignListItem {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      status: campaign.status,
      currentStep: campaign.currentStep,
      name: campaign.name ?? null,
      categories: (campaign.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
      platforms: AdvertiserCampaignMapper.mapPlatforms(campaign.platforms),
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
      platforms: AdvertiserCampaignMapper.mapPlatforms(campaign.platforms),
      implementationTypes: AdvertiserCampaignMapper.mapImplementationTypes(
        campaign.implementationTypes,
      ),
      campaignVisibility: campaign.campaignVisibility ?? null,
      startDate: campaign.startDate ?? null,
      endDate: campaign.endDate ?? null,
      applicationDeadlineDate: campaign.applicationDeadlineDate ?? null,
      contentTypes: AdvertiserCampaignMapper.mapContentTypes(
        campaign.contentTypes,
      ),
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
      implementationTypes: AdvertiserCampaignMapper.mapImplementationTypes(
        profile?.implementationTypes,
      ),
      contentTypes: AdvertiserCampaignMapper.mapContentTypes(
        profile?.contentTypes,
      ),
      description: profile?.description,
      implementationPeriodDays: profile?.implementationPeriodDays,
      platforms: AdvertiserCampaignMapper.mapPlatforms(profile?.platforms),
    };
  }

  private static mapContentTypes(
    items: ContentType[] | undefined,
  ): NamedRelationItem[] {
    return (items ?? []).map((c) => ({ id: c.id, name: c.name }));
  }

  private static mapImplementationTypes(
    items: ImplementationType[] | undefined,
  ): NamedRelationItem[] {
    return (items ?? []).map((c) => ({ id: c.id, name: c.name }));
  }

  private static mapPlatforms(
    items: { id: string; name: string }[] | undefined,
  ): NamedRelationItem[] {
    return (items ?? []).map((c) => ({ id: c.id, name: c.name }));
  }
}
