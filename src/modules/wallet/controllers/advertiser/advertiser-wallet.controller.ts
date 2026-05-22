import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdvertiserWalletService } from '../../services/advertiser/advertiser-wallet.service';
import { AdvertiserWalletTransactionService } from '../../services/advertiser/advertiser-wallet-transaction.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Statuses } from '../../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import {
  AdvertiserTransactionListWithBalance,
  AdvertiserWalletSummary,
} from '../../interfaces';
import {
  AdvertiserTransactionFilterDto,
  ChargeWalletDto,
  WithdrawDto,
} from '../../dto';

@Controller('advertiser/wallet')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserWalletController {
  constructor(
    private readonly advertiserWalletService: AdvertiserWalletService,
    private readonly advertiserWalletTransactionService: AdvertiserWalletTransactionService,
  ) {}

  @Get('summary')
  getSummary(@AuthUser() user: User): Promise<AdvertiserWalletSummary> {
    return this.advertiserWalletService.getSummary(user.id);
  }

  @Get('transactions')
  getTransactions(
    @AuthUser() user: User,
    @Query() filter: AdvertiserTransactionFilterDto,
  ): Promise<AdvertiserTransactionListWithBalance> {
    return this.advertiserWalletTransactionService.getTransactions(user.id, filter);
  }

  @Post('charge')
  async createChargeRequest(
    @AuthUser() user: User,
    @Body() dto: ChargeWalletDto,
  ): Promise<{ message: string }> {
    await this.advertiserWalletTransactionService.createChargeTransaction({
      advertiserId: user.id,
      amount: dto.amount,
      invoiceImageUrl: dto.invoiceImageUrl,
      invoiceImagePublicId: dto.invoiceImagePublicId,
      description: dto.description,
    });
    return { message: 'تم إرسال طلب شحن المحفظة بنجاح' };
  }

  @Post('withdraw')
  async createWithdrawRequest(
    @AuthUser() user: User,
    @Body() dto: WithdrawDto,
  ): Promise<{ message: string }> {
    await this.advertiserWalletTransactionService.createWithdrawTransaction({
      advertiserId: user.id,
      amount: dto.amount,
    });
    return { message: 'تم إرسال طلب السحب بنجاح' };
  }
}
