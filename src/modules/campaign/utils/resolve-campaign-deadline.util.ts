import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus } from '../enums';

export function resolveCampaignDeadline(campaign: Campaign): Date | null {
  switch (campaign.status) {
    case CampaignStatus.APPROVED:
      return campaign.deadlineDate;
    case CampaignStatus.PENDING_MINIMUM:
      return campaign.pendingMinimumDeadline;
    case CampaignStatus.IMPLEMENTATION:
      return campaign.implementationEndDate;
    default:
      return null;
  }
}
