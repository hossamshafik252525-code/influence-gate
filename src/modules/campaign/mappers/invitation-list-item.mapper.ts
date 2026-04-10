import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import {
  InvitationListItem,
  InvitationOrderedServiceItem,
} from '../interfaces/influencer-campaign.interface';

export class InvitationListItemMapper {
  static toListItem(invitation: CampaignInvitedInfluencer): InvitationListItem {
    return {
      id: invitation.id,
      campaignId: invitation.campaignId,
      status: invitation.status,
      createdAt: invitation.createdAt,
      campaign: {
        id: invitation.campaign.id,
        campaignNumber: invitation.campaign.campaignNumber,
        name: invitation.campaign.name,
        description: invitation.campaign.description,
        includedPlatforms: invitation.campaign.includedPlatforms,
        contentTypes: invitation.campaign.contentTypes,
        deadlineDate: invitation.campaign.deadlineDate,
        implementationStartDate: invitation.campaign.implementationStartDate ?? null,
        implementationEndDate: invitation.campaign.implementationEndDate ?? null,
        influencerPrice: invitation.campaign.influencerPrice
          ? Number(invitation.campaign.influencerPrice)
          : 0,
        status: invitation.campaign.status,
      },
      orderedServices: (invitation.orderedServices ?? []).map(
        (os): InvitationOrderedServiceItem => ({
          id: os.id,
          serviceId: os.serviceId,
          basePrice: Number(os.basePrice),
          priceWithFee: Number(os.priceWithFee),
          implementationType: os.service?.implementationType,
          contentType: os.service?.contentType,
          description: os.service?.description,
          implementationPeriodDays: os.service?.implementationPeriodDays,
          includedPlatforms: os.service?.includedPlatforms,
        }),
      ),
    };
  }
}
