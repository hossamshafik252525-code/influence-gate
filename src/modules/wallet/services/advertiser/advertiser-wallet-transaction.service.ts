import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AdvertiserWalletTransaction } from '../../entities/advertiser-wallet-transaction.entity';
import { AdvertiserTransactionType, TransactionStatus } from '../../enums';
import {
  AdvertiserTransactionListWithBalance,
  AdvertiserWalletTransactionItem,
  CreateChargeTransactionInput,
  CreateWithdrawTransactionInput,
  GeneratePayInfluencerTransactionInput,
  GenerateReleaseTransactionInput,
  GenerateReserveTransactionInput,
} from '../../interfaces';
import { AdvertiserTransactionFilterDto } from '../../dto';
import { AdvertiserWalletService } from './advertiser-wallet.service';

@Injectable()
export class AdvertiserWalletTransactionService {
  constructor(
    @InjectRepository(AdvertiserWalletTransaction)
    private readonly transactionRepo: Repository<AdvertiserWalletTransaction>,
    private readonly advertiserWalletService: AdvertiserWalletService,
  ) {}

  async getTransactions(
    advertiserId: string,
    filter: AdvertiserTransactionFilterDto,
  ): Promise<AdvertiserTransactionListWithBalance> {
    const wallet = await this.advertiserWalletService.getOrCreateWallet(advertiserId);

    const qb = this.transactionRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.campaign', 'campaign')
      .leftJoinAndSelect('tx.influencer', 'influencer')
      .leftJoinAndSelect('influencer.influencerProfile', 'influencerProfile')
      .where('tx.walletId = :walletId', { walletId: wallet.id });

    if (filter.status) {
      qb.andWhere('tx.status = :status', { status: filter.status });
    }

    if (filter.type) {
      qb.andWhere('tx.type = :type', { type: filter.type });
    }

    if (filter.campaignId) {
      qb.andWhere('tx.campaignId = :campaignId', { campaignId: filter.campaignId });
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

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((row) => this.toTransactionItem(row)),
      pagination: { total, page: filter.page, limit: filter.limit },
      walletBalance: this.advertiserWalletService.toSummary(wallet),
    };
  }

  async createChargeTransaction(
    input: CreateChargeTransactionInput,
  ): Promise<AdvertiserWalletTransaction> {
    const wallet = await this.advertiserWalletService.getOrCreateWallet(input.advertiserId);

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: AdvertiserTransactionType.CHARGE,
      status: TransactionStatus.PENDING_REVIEW,
      amount: input.amount,
      invoiceImageUrl: input.invoiceImageUrl,
      invoiceImagePublicId: input.invoiceImagePublicId,
      description: input.description ?? null,
    });

    return this.transactionRepo.save(transaction);
  }

  async createWithdrawTransaction(
    input: CreateWithdrawTransactionInput,
  ): Promise<AdvertiserWalletTransaction> {
    const wallet = await this.advertiserWalletService.getOrCreateWallet(input.advertiserId);

    if (input.amount <= 0) {
      throw new BadRequestException('المبلغ يجب أن يكون أكبر من صفر');
    }

    if (input.amount > Number(wallet.availableBalance)) {
      throw new BadRequestException('الرصيد غير كافٍ للسحب');
    }

    await this.advertiserWalletService.debitAvailable(wallet, input.amount);

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: AdvertiserTransactionType.WITHDRAW,
      status: TransactionStatus.PENDING_REVIEW,
      amount: input.amount,
    });

    return this.transactionRepo.save(transaction);
  }

  async generateReserveTransaction(
    input: GenerateReserveTransactionInput,
    manager?: EntityManager,
  ): Promise<AdvertiserWalletTransaction> {
    const wallet = await this.advertiserWalletService.getOrCreateWallet(input.advertiserId);

    if (input.amount <= 0) {
      throw new BadRequestException('المبلغ يجب أن يكون أكبر من صفر');
    }

    if (input.amount > Number(wallet.availableBalance)) {
      throw new BadRequestException('الرصيد المتاح لا يكفي ');
    }

    await this.advertiserWalletService.moveAvailableToReserved(wallet, input.amount, manager);

    const repo = manager
      ? manager.getRepository(AdvertiserWalletTransaction)
      : this.transactionRepo;
    const transaction = repo.create({
      walletId: wallet.id,
      type: AdvertiserTransactionType.RESERVE,
      status: TransactionStatus.DONE,
      amount: input.amount,
      campaignId: input.campaignId,
      influencerId: input.influencerId ?? null,
      description: input.description ?? null,
    });

    return repo.save(transaction);
  }

  async generateReleaseTransaction(
    input: GenerateReleaseTransactionInput,
    manager?: EntityManager,
  ): Promise<AdvertiserWalletTransaction> {
    const wallet = await this.advertiserWalletService.getOrCreateWallet(input.advertiserId);

    if (input.amount <= 0) {
      throw new BadRequestException('المبلغ يجب أن يكون أكبر من صفر');
    }

    if (input.amount > Number(wallet.reservedBalance)) {
      throw new BadRequestException('الرصيد المحجوز غير كافٍ للتحرير');
    }

    await this.advertiserWalletService.moveReservedToAvailable(wallet, input.amount, manager);

    const repo = manager
      ? manager.getRepository(AdvertiserWalletTransaction)
      : this.transactionRepo;
    const transaction = repo.create({
      walletId: wallet.id,
      type: AdvertiserTransactionType.RELEASE_RESERVED,
      status: TransactionStatus.DONE,
      amount: input.amount,
      campaignId: input.campaignId,
      influencerId: input.influencerId ?? null,
      description: input.description ?? null,
    });

    return repo.save(transaction);
  }

  async getCampaignActualPaid(campaignId: string): Promise<number> {
    const result: { total: string | null } = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('tx.campaignId = :campaignId', { campaignId })
      .andWhere('tx.type = :type', {
        type: AdvertiserTransactionType.PAY_INFLUENCER,
      })
      .andWhere('tx.status = :status', { status: TransactionStatus.DONE })
      .getRawOne();

    return Number(result?.total ?? 0);
  }

  async generatePayInfluencerTransaction(
    input: GeneratePayInfluencerTransactionInput,
  ): Promise<AdvertiserWalletTransaction> {
    const wallet = await this.advertiserWalletService.getOrCreateWallet(input.advertiserId);

    if (input.amount <= 0) {
      throw new BadRequestException('المبلغ يجب أن يكون أكبر من صفر');
    }

    if (input.amount > Number(wallet.reservedBalance)) {
      throw new BadRequestException('الرصيد المحجوز غير كافٍ لدفع المؤثر');
    }

    await this.advertiserWalletService.moveReservedToPaid(wallet, input.amount);

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: AdvertiserTransactionType.PAY_INFLUENCER,
      status: TransactionStatus.DONE,
      amount: input.amount,
      campaignId: input.campaignId,
      influencerId: input.influencerId,
      description: input.description ?? null,
    });

    return this.transactionRepo.save(transaction);
  }

  private toTransactionItem(
    row: AdvertiserWalletTransaction,
  ): AdvertiserWalletTransactionItem {
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      amount: Number(row.amount),
      campaign: row.campaign
        ? { id: row.campaign.id, name: row.campaign.name ?? null }
        : null,
      influencer: row.influencer
        ? {
            id: row.influencer.id,
            fullName: row.influencer.fullName,
            profileImageUrl: row.influencer.influencerProfile?.profileImageUrl ?? null,
          }
        : null,
      invoiceImageUrl: row.invoiceImageUrl,
      invoiceImagePublicId: row.invoiceImagePublicId,
      description: row.description,
      adminNotes: row.adminNotes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
