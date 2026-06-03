import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AdvertiserWallet } from '../../entities/advertiser-wallet.entity';
import { AdvertiserWalletSummary } from '../../interfaces';

@Injectable()
export class AdvertiserWalletService {
  constructor(
    @InjectRepository(AdvertiserWallet)
    private readonly walletRepo: Repository<AdvertiserWallet>,
  ) {}

  async getOrCreateWallet(advertiserId: string): Promise<AdvertiserWallet> {
    const existing = await this.walletRepo.findOne({ where: { advertiserId } });
    if (existing) return existing;

    const wallet = this.walletRepo.create({ advertiserId });
    return this.walletRepo.save(wallet);
  }

  async getSummary(advertiserId: string): Promise<AdvertiserWalletSummary> {
    const wallet = await this.getOrCreateWallet(advertiserId);
    return this.toSummary(wallet);
  }

  toSummary(wallet: AdvertiserWallet): AdvertiserWalletSummary {
    return {
      availableBalance: Number(wallet.availableBalance),
      reservedBalance: Number(wallet.reservedBalance),
      totalPaid: Number(wallet.totalPaid),
    };
  }

  async debitAvailable(wallet: AdvertiserWallet, amount: number): Promise<void> {
    await this.walletRepo.update(wallet.id, {
      availableBalance: Number(wallet.availableBalance) - amount,
    });
  }

  async moveAvailableToReserved(
    wallet: AdvertiserWallet,
    amount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(AdvertiserWallet) : this.walletRepo;
    await repo.update(wallet.id, {
      availableBalance: Number(wallet.availableBalance) - amount,
      reservedBalance: Number(wallet.reservedBalance) + amount,
    });
  }

  async moveReservedToAvailable(
    wallet: AdvertiserWallet,
    amount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(AdvertiserWallet) : this.walletRepo;
    await repo.update(wallet.id, {
      reservedBalance: Number(wallet.reservedBalance) - amount,
      availableBalance: Number(wallet.availableBalance) + amount,
    });
  }

  async moveReservedToPaid(
    wallet: AdvertiserWallet,
    amount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(AdvertiserWallet) : this.walletRepo;
    await repo.update(wallet.id, {
      reservedBalance: Number(wallet.reservedBalance) - amount,
      totalPaid: Number(wallet.totalPaid) + amount,
    });
  }
}
