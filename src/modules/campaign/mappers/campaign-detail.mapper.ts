import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../submissions/entities/campaign-submission.entity';
import { CampaignVisibility } from '../enums';
import { ApplicationStatus } from '../applications/enums';
import {
  CampaignDetailResult,
  ApplicationSubmissionDetail,
} from '../interfaces/influencer-campaign.interface';
import { resolveCampaignDeadline, resolveCampaignStatus } from '../utils';

export class CampaignDetailMapper {
  static toDetail(
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
      category: campaign.category
        ? { id: campaign.category.id, name: campaign.category.name }
        : null,
      includedPlatforms: campaign.includedPlatforms,
      contentTypes: campaign.contentTypes,
      contentDescription: campaign.contentDescription,
      requirementsFile: campaign.contentPdfUrl,
      implementationType: campaign.implementationType,
      implementationPeriodDays: campaign.implementationPeriodDays,
      relevantDeadline: resolveCampaignDeadline(campaign),
      requiredInfluencersCount: campaign.requiredInfluencersCount,
      influencerType: campaign.influencerType,
      ...CampaignDetailMapper.resolvePrice(campaign, invitation),
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
      result.submission = CampaignDetailMapper.mapSubmission(submission);
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

  private static resolvePrice(
    campaign: Campaign,
    invitation: CampaignInvitedInfluencer | null,
  ): { influencerPrice: number } | { orderedServicesPrice: number } {
    if (
      campaign.campaignVisibility === CampaignVisibility.PRIVATE &&
      invitation
    ) {
      return { orderedServicesPrice: Number(invitation.priceWithFee) };
    }
    return { influencerPrice: Number(campaign.influencerPrice) };
  }

  private static mapSubmission(submission: CampaignSubmission): ApplicationSubmissionDetail {
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
