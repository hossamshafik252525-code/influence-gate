import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WalletInfluencerService } from '../../services/influencer/wallet-influencer.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { WalletSummary, TransactionListWithBalance } from '../../interfaces';
import { WithdrawDto, TransactionFilterDto } from '../../dto';

@Controller('influencer/wallet')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
export class WalletInfluencerController {
  constructor(private readonly walletInfluencerService: WalletInfluencerService) {}

  @Get('summary')
  getSummary(@AuthUser() user: User): Promise<WalletSummary> {
    return this.walletInfluencerService.getSummary(user.id);
  }

  @Get('transactions')
  getTransactions(
    @AuthUser() user: User,
    @Query() filter: TransactionFilterDto,
  ): Promise<TransactionListWithBalance> {
    return this.walletInfluencerService.getTransactions(user.id, filter);
  }

  @Post('withdraw')
  async requestWithdrawal(
    @AuthUser() user: User,
    @Body() dto: WithdrawDto,
  ): Promise<{ message: string }> {
    await this.walletInfluencerService.requestWithdrawal(user.id, dto.amount);
    return { message: 'تم إرسال طلب السحب بنجاح' };
  }
}
