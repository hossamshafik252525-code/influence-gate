import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletTransaction } from '../../entities/wallet-transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { TransactionType, TransactionStatus } from '../../enums';
import {
  CreateRevenueTransactionInput,
  CreateWithdrawalTransactionInput,
} from '../../interfaces';

@Injectable()
export class WalletTransactionService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async createRevenueTransaction(input: CreateRevenueTransactionInput): Promise<WalletTransaction> {
    const wallet = await this.ensureWalletExists(input.influencerId);

    if (input.status === TransactionStatus.PENDING_REVIEW) {
      await this.walletRepo.update(wallet.id, {
        pendingBalance: Number(wallet.pendingBalance) + input.amount,
      });
    }

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: input.status,
      amount: input.amount,
      campaignId: input.campaignId,
      campaignName: input.campaignName,
      includedPlatforms: input.includedPlatforms,
    });

    return this.transactionRepo.save(transaction);
  }

  async createWithdrawalTransaction(input: CreateWithdrawalTransactionInput): Promise<WalletTransaction> {
    const wallet = await this.ensureWalletExists(input.influencerId);

    if (input.amount > Number(wallet.withdrawableBalance)) {
      throw new BadRequestException('الرصيد غير كافٍ للسحب');
    }

    await this.walletRepo.update(wallet.id, {
      withdrawableBalance: Number(wallet.withdrawableBalance) - input.amount,
      pendingBalance: Number(wallet.pendingBalance) + input.amount,
    });

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING_REVIEW,
      amount: input.amount,
    });

    return this.transactionRepo.save(transaction);
  }

  private async ensureWalletExists(userId: string): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) return existing;

    const wallet = this.walletRepo.create({ userId });
    return this.walletRepo.save(wallet);
  }
}
