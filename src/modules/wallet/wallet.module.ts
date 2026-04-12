import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WalletTransactionService } from './services/wallet-transaction.service';
import { WalletInfluencerService } from './services/wallet-influencer.service';
import { WalletAdminService } from './services/wallet-admin.service';
import { WalletInfluencerController } from './controllers/wallet-influencer.controller';
import { WalletAdminController } from './controllers/wallet-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransaction])],
  controllers: [WalletInfluencerController, WalletAdminController],
  providers: [WalletTransactionService, WalletInfluencerService, WalletAdminService],
  exports: [WalletTransactionService],
})
export class WalletModule {}
