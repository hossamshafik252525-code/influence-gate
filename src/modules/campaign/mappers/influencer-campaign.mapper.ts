import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../submissions/entities/campaign-submission.entity';
import { CampaignVisibility } from '../enums';
import { ApplicationStatus } from '../applications/enums';
import {
  NewCampaignListItem,
  MyCampaignListItem,
  CampaignDetailResult,
  ApplicationSubmissionDetail,
} from '../interfaces/influencer-campaign.interface';
import { resolveCampaignDeadline, resolveCampaignStatus } from '../utils';

export class InfluencerCampaignMapper {
  static toNewCampaignListItem(campaign: Campaign): NewCampaignListItem {
    return InfluencerCampaignMapper.toCampaignListItemBase(campaign);
  }

  static toMyCampaignListItem(campaign: Campaign): MyCampaignListItem {
    return InfluencerCampaignMapper.toCampaignListItemBase(campaign);
  }

  static toCampaignDetail(
    campaign: Campaign,
    application: CampaignApplication | null,
    submission: CampaignSubmission | null,
    invitation: CampaignInvitedInfluencer | null,
  ): CampaignDetailResult {
    const result: CampaignDetailResult = {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      status: resolveCampaignStatus(campaign.status),
      name: campaign.name,
      description: campaign.description,
      categories: (campaign.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
      contentDescription: campaign.contentDescription,
      requirementsFile: campaign.contentPdfUrl,
      implementationType: campaign.implementationType,
      implementationPeriodDays: campaign.implementationPeriodDays,
      relevantDeadline: resolveCampaignDeadline(campaign),
      requiredInfluencersCount: campaign.requiredInfluencersCount,
      influencerType: campaign.influencerType,
      ...InfluencerCampaignMapper.resolveOrderedServicesPrice(campaign, invitation),
    };

    if (application) {
      result.application = {
        id: application.id,
        status:
          application.status === ApplicationStatus.PENDING_ADMIN_APPROVAL
            ? ApplicationStatus.PENDING
            : application.status,
        offerPrice:
          application.offerPrice === null || application.offerPrice === undefined
            ? null
            : Number(application.offerPrice),
      };
    }

    if (submission) {
      result.submission = InfluencerCampaignMapper.toSubmissionDetail(submission);
    }

    if (invitation) {
      const profile = invitation.influencer?.influencerProfile;
      result.invitation = {
        id: invitation.id,
        status: invitation.status,
        price: Number(invitation.priceWithFee),
        implementationType: profile?.implementationType,
        contentType: profile?.contentType,
        description: profile?.description,
        implementationPeriodDays: profile?.implementationPeriodDays,
        includedPlatforms: profile?.includedPlatforms,
      };
    }

    return result;
  }

  static toCampaignListItemBase(campaign: Campaign): NewCampaignListItem {
    return {
      id: campaign.id,
      campaignNumber: campaign.campaignNumber,
      name: campaign.name,
      description: campaign.description,
      status: resolveCampaignStatus(campaign.status),
      relevantDeadline: resolveCampaignDeadline(campaign),
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
    };
  }

  private static resolveOrderedServicesPrice(
    campaign: Campaign,
    invitation: CampaignInvitedInfluencer | null,
  ): { orderedServicesPrice?: number } {
    if (campaign.campaignVisibility === CampaignVisibility.PRIVATE && invitation) {
      return { orderedServicesPrice: Number(invitation.priceWithFee) };
    }
    return {};
  }

  private static toSubmissionDetail(submission: CampaignSubmission): ApplicationSubmissionDetail {
    return {
      id: submission.id,
      status: submission.status,
      links: submission.links,
      fileUrls: submission.fileUrls ?? null,
      modificationDetails: submission.modificationDetails ?? null,
      modificationFileUrls: submission.modificationFileUrls ?? null,
    };
  }
}
