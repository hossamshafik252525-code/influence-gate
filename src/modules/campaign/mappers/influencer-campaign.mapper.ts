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
  NamedRelationItem,
} from '../interfaces/influencer-campaign.interface';
import { ContentType } from '../../content-types/entities/content-type.entity';
import { ImplementationType } from '../../implementation-types/entities/implementation-type.entity';
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
      contentTypes: InfluencerCampaignMapper.mapContentTypes(
        campaign.contentTypes,
      ),
      contentDescription: campaign.contentDescription,
      requirementsFile: campaign.contentPdfUrl,
      implementationTypes: InfluencerCampaignMapper.mapImplementationTypes(
        campaign.implementationTypes,
      ),
      startDate: campaign.startDate ?? null,
      endDate: campaign.endDate ?? null,
      applicationDeadlineDate: campaign.applicationDeadlineDate ?? null,
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
        implementationTypes: InfluencerCampaignMapper.mapImplementationTypes(
          profile?.implementationTypes,
        ),
        contentTypes: InfluencerCampaignMapper.mapContentTypes(
          profile?.contentTypes,
        ),
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
      contentTypes: InfluencerCampaignMapper.mapContentTypes(
        campaign.contentTypes,
      ),
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
