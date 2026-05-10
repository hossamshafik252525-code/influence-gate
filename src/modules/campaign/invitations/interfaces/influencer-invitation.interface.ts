import { PaginatedResult } from '../../../../common/interfaces';
import { InvitationStatus } from '../enums/invitation-status.enum';
import { CampaignListItemBase } from '../../interfaces/influencer-campaign.interface';

export interface InfluencerInvitationItem {
  id: string;
  status: InvitationStatus;
  createdAt: Date;
  campaign: CampaignListItemBase;
}

export type GetInfluencerInvitationsResult = PaginatedResult<InfluencerInvitationItem>;
