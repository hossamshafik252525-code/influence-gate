import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletSummary } from './interfaces';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async ensureWalletExists(userId: string): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    const wallet = this.walletRepo.create({ userId });
    return this.walletRepo.save(wallet);
  }

  async getWalletSummary(userId: string): Promise<WalletSummary> {
    const wallet = await this.ensureWalletExists(userId);
    return { balance: Number(wallet.balance) };
  }
}
