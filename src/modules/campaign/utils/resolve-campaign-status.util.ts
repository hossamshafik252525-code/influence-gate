import { CampaignStatus, ResolvedCampaignStatus } from '../enums';

export function resolveCampaignStatus(status: CampaignStatus): ResolvedCampaignStatus {
  switch (status) {
    case CampaignStatus.APPROVED:
    case CampaignStatus.PENDING_MINIMUM:
      return ResolvedCampaignStatus.APPLICATION_PERIOD;
    case CampaignStatus.IMPLEMENTATION:
      return ResolvedCampaignStatus.IMPLEMENTATION;
    case CampaignStatus.COMPLETED:
      return ResolvedCampaignStatus.COMPLETED;
    case CampaignStatus.DISCARDED:
      return ResolvedCampaignStatus.DISCARDED;
    default:
      return ResolvedCampaignStatus.APPLICATION_PERIOD;
  }
}

export function resolvedStatusToCampaignStatuses(
  resolved: ResolvedCampaignStatus,
): CampaignStatus[] {
  switch (resolved) {
    case ResolvedCampaignStatus.APPLICATION_PERIOD:
      return [CampaignStatus.APPROVED, CampaignStatus.PENDING_MINIMUM];
    case ResolvedCampaignStatus.IMPLEMENTATION:
      return [CampaignStatus.IMPLEMENTATION];
    case ResolvedCampaignStatus.COMPLETED:
      return [CampaignStatus.COMPLETED];
    case ResolvedCampaignStatus.DISCARDED:
      return [CampaignStatus.DISCARDED];
  }
}
