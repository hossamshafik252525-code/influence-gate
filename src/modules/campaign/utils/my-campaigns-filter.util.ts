import { CampaignStatus, MyCampaignsStatusFilter } from '../enums';

export function myCampaignsFilterToStatuses(
  filter: MyCampaignsStatusFilter,
): CampaignStatus[] {
  switch (filter) {
    case MyCampaignsStatusFilter.ALL:
      return [
        CampaignStatus.SCHEDULED,
        CampaignStatus.APPROVED,
        CampaignStatus.PENDING_MINIMUM,
        CampaignStatus.IMPLEMENTATION,
        CampaignStatus.COMPLETED,
        CampaignStatus.DISCARDED,
      ];
    case MyCampaignsStatusFilter.APPLICATION_PERIOD:
      return [
        CampaignStatus.SCHEDULED,
        CampaignStatus.APPROVED,
        CampaignStatus.PENDING_MINIMUM,
      ];
    case MyCampaignsStatusFilter.IMPLEMENTATION:
      return [CampaignStatus.IMPLEMENTATION];
    case MyCampaignsStatusFilter.COMPLETED:
      return [CampaignStatus.COMPLETED];
    case MyCampaignsStatusFilter.DISCARDED:
      return [CampaignStatus.DISCARDED];
  }
}
