import { TransactionType, TransactionStatus } from '../enums';
import { TargetPlatform } from '../../../common/enums';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface WalletTransactionItem {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  campaignId: string | null;
  campaignName: string | null;
  includedPlatforms: TargetPlatform[] | null;
  description: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WalletTransactionListResult = PaginatedResult<WalletTransactionItem>;

export interface TransactionListWithBalance {
  data: WalletTransactionItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  walletBalance: {
    withdrawableBalance: number;
    pendingBalance: number;
  };
}

export interface CreateRevenueTransactionInput {
  influencerId: string;
  amount: number;
  campaignId: string;
  campaignName: string;
  includedPlatforms: TargetPlatform[];
  status: TransactionStatus;
}

export interface CreateWithdrawalTransactionInput {
  influencerId: string;
  amount: number;
}
