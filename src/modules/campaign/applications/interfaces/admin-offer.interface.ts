import { PaginatedResult } from '../../../../common/interfaces';

export interface AdminPendingOfferItem {
  applicationId: string;
  influencerPrice: number;
  offerPrice: number;
  priceDelta: number;
  campaign: {
    id: string;
    campaignNumber: number;
    name: string;
  };
  advertiser: {
    id: string;
    fullName: string;
  };
  influencer: {
    id: string;
    fullName: string;
  };
  createdAt: Date;
}

export type GetAdminPendingOffersResult = PaginatedResult<AdminPendingOfferItem>;
