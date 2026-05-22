import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { AdvertiserWallet } from './entities/advertiser-wallet.entity';
import { AdvertiserWalletTransaction } from './entities/advertiser-wallet-transaction.entity';
import { WalletTransactionService } from './services/influencer/wallet-transaction.service';
import { WalletInfluencerService } from './services/influencer/wallet-influencer.service';
import { WalletAdminService } from './services/admin/wallet-admin.service';
import { AdvertiserWalletService } from './services/advertiser/advertiser-wallet.service';
import { AdvertiserWalletTransactionService } from './services/advertiser/advertiser-wallet-transaction.service';
import { WalletInfluencerController } from './controllers/influencer/wallet-influencer.controller';
import { WalletAdminController } from './controllers/admin/wallet-admin.controller';
import { AdvertiserWalletController } from './controllers/advertiser/advertiser-wallet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      WalletTransaction,
      AdvertiserWallet,
      AdvertiserWalletTransaction,
    ]),
  ],
  controllers: [WalletInfluencerController, WalletAdminController, AdvertiserWalletController],
  providers: [
    WalletTransactionService,
    WalletInfluencerService,
    WalletAdminService,
    AdvertiserWalletService,
    AdvertiserWalletTransactionService,
  ],
  exports: [
    WalletTransactionService,
    AdvertiserWalletService,
    AdvertiserWalletTransactionService,
  ],
})
export class WalletModule {}
