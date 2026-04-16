import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import { CampaignVisibility } from '../enums';
import {
  CampaignDetailResult,
  ApplicationSubmissionDetail,
  OrderedServiceDetail,
} from '../interfaces/influencer-campaign.interface';
import { resolveCampaignDeadline } from '../utils';

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
      status: campaign.status,
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
      result.application = { id: application.id, status: application.status };
    }

    if (submission) {
      result.submission = CampaignDetailMapper.mapSubmission(submission);
    }

    if (invitation) {
      result.invitation = {
        id: invitation.id,
        status: invitation.status,
        orderedServices: (invitation.orderedServices ?? []).map(
          (os): OrderedServiceDetail => ({
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

    return result;
  }

  private static resolvePrice(
    campaign: Campaign,
    invitation: CampaignInvitedInfluencer | null,
  ): { influencerPrice: number } | { orderedServicesPrice: number } {
    if (
      campaign.campaignVisibility === CampaignVisibility.PRIVATE &&
      invitation?.orderedServices?.length
    ) {
      const total = invitation.orderedServices.reduce(
        (sum, os) => sum + Number(os.basePrice),
        0,
      );
      return { orderedServicesPrice: total };
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
