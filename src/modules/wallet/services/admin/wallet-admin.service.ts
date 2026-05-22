import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletTransaction } from '../../entities/wallet-transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { TransactionType, TransactionStatus } from '../../enums';
import { WalletTransactionListResult } from '../../interfaces';
import { ReviewTransactionDto, TransactionFilterDto } from '../../dto';

@Injectable()
export class WalletAdminService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async getPendingTransactions(filter: TransactionFilterDto): Promise<WalletTransactionListResult> {
    const [data, total] = await this.transactionRepo.findAndCount({
      where: { status: TransactionStatus.PENDING_REVIEW },
      order: { createdAt: 'ASC' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });

    return {
      data: data as WalletTransactionListResult['data'],
      pagination: { total, page: filter.page, limit: filter.limit },
    };
  }

  async reviewTransaction(
    transactionId: string,
    dto: ReviewTransactionDto,
  ): Promise<WalletTransaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId, status: TransactionStatus.PENDING_REVIEW },
      relations: ['wallet'],
    });

    if (!transaction) {
      throw new NotFoundException('المعاملة غير موجودة أو تمت مراجعتها مسبقاً');
    }

    const wallet = transaction.wallet;

    if (dto.status === TransactionStatus.DONE) {
      if (transaction.type === TransactionType.REVENUE) {
        await this.walletRepo.update(wallet.id, {
          pendingBalance: Number(wallet.pendingBalance) - Number(transaction.amount),
          withdrawableBalance: Number(wallet.withdrawableBalance) + Number(transaction.amount),
        });
      } else {
        await this.walletRepo.update(wallet.id, {
          pendingBalance: Number(wallet.pendingBalance) - Number(transaction.amount),
        });
      }
    } else {
      if (transaction.type === TransactionType.REVENUE) {
        await this.walletRepo.update(wallet.id, {
          pendingBalance: Number(wallet.pendingBalance) - Number(transaction.amount),
        });
      } else {
        await this.walletRepo.update(wallet.id, {
          pendingBalance: Number(wallet.pendingBalance) - Number(transaction.amount),
          withdrawableBalance: Number(wallet.withdrawableBalance) + Number(transaction.amount),
        });
      }
    }

    await this.transactionRepo.update(transactionId, {
      status: dto.status,
      adminNotes: dto.adminNotes ?? null,
    });

    return this.transactionRepo.findOne({ where: { id: transactionId } });
  }
}
