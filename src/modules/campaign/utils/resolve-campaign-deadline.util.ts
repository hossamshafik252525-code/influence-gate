import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus } from '../enums';

export function resolveCampaignDeadline(campaign: Campaign): Date | null {
  switch (campaign.status) {
    case CampaignStatus.SCHEDULED:
      return campaign.startDate;
    case CampaignStatus.APPROVED:
      return campaign.applicationDeadlineDate;
    case CampaignStatus.PENDING_MINIMUM:
      return campaign.pendingMinimumDeadline;
    case CampaignStatus.IMPLEMENTATION:
      return campaign.endDate;
    default:
      return null;
  }
}
