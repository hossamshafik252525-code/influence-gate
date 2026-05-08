import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { WalletSummary, WalletTransactionListResult, TransactionListWithBalance } from '../interfaces';
import { TransactionFilterDto, WithdrawDto } from '../dto';
import { WalletTransactionService } from './wallet-transaction.service';

@Injectable()
export class WalletInfluencerService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    private readonly walletTransactionService: WalletTransactionService,
  ) {}

  async getSummary(userId: string): Promise<WalletSummary> {
    const wallet = await this.ensureWalletExists(userId);
    return {
      withdrawableBalance: Number(wallet.withdrawableBalance),
      pendingBalance: Number(wallet.pendingBalance),
    };
  }

  async getTransactions(
    userId: string,
    filter: TransactionFilterDto,
  ): Promise<TransactionListWithBalance> {
    const wallet = await this.ensureWalletExists(userId);

    const qb = this.transactionRepo
      .createQueryBuilder('tx')
      .where('tx.walletId = :walletId', { walletId: wallet.id });

    if (filter.status) {
      qb.andWhere('tx.status = :status', { status: filter.status });
    }

    if (filter.type) {
      qb.andWhere('tx.type = :type', { type: filter.type });
    }

    if (filter.startDate) {
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('tx.createdAt >= :startDate', { startDate: start });
    }

    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('tx.createdAt <= :endDate', { endDate: end });
    }

    qb.orderBy('tx.createdAt', 'DESC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data as WalletTransactionListResult['data'],
      pagination: { total, page: filter.page, limit: filter.limit },
      walletBalance: {
        withdrawableBalance: Number(wallet.withdrawableBalance),
        pendingBalance: Number(wallet.pendingBalance),
      },
    };
  }

  async requestWithdrawal(userId: string, amount: number): Promise<void> {
    const wallet = await this.ensureWalletExists(userId);

    if (amount <= 0) {
      throw new BadRequestException('المبلغ يجب أن يكون أكبر من صفر');
    }

    if (amount > Number(wallet.withdrawableBalance)) {
      throw new BadRequestException('الرصيد غير كافٍ للسحب');
    }

    await this.walletTransactionService.createWithdrawalTransaction({
      influencerId: userId,
      amount,
    });
  }

  private async ensureWalletExists(userId: string): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) return existing;

    const wallet = this.walletRepo.create({ userId });
    return this.walletRepo.save(wallet);
  }
}
