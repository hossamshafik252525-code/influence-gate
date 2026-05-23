import { AdvertiserTransactionType, TransactionStatus } from '../../enums';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import { AdvertiserWalletSummary } from './advertiser-wallet-summary.interface';

export interface AdvertiserTransactionCampaignRef {
  id: string;
  name: string | null;
}

export interface AdvertiserTransactionInfluencerRef {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

export interface AdvertiserWalletTransactionItem {
  id: string;
  type: AdvertiserTransactionType;
  status: TransactionStatus;
  amount: number;
  campaign: AdvertiserTransactionCampaignRef | null;
  influencer: AdvertiserTransactionInfluencerRef | null;
  invoiceImageUrl: string | null;
  invoiceImagePublicId: string | null;
  description: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AdvertiserWalletTransactionListResult = PaginatedResult<AdvertiserWalletTransactionItem>;

export interface AdvertiserTransactionListWithBalance {
  data: AdvertiserWalletTransactionItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  walletBalance: AdvertiserWalletSummary;
}

export interface CreateChargeTransactionInput {
  advertiserId: string;
  amount: number;
  invoiceImageUrl: string;
  invoiceImagePublicId: string;
  description?: string;
}

export interface CreateWithdrawTransactionInput {
  advertiserId: string;
  amount: number;
}

export interface GenerateReserveTransactionInput {
  advertiserId: string;
  amount: number;
  campaignId: string;
  influencerId?: string;
  description?: string;
}

export interface GenerateReleaseTransactionInput {
  advertiserId: string;
  amount: number;
  campaignId: string;
  influencerId?: string;
  description?: string;
}

export interface GeneratePayInfluencerTransactionInput {
  advertiserId: string;
  amount: number;
  campaignId: string;
  influencerId: string;
  description?: string;
}
