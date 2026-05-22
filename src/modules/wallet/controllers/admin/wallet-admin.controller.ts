import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WalletAdminService } from '../../services/admin/wallet-admin.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Role } from '../../../../common/enums';
import { WalletTransactionListResult } from '../../interfaces';
import { ReviewTransactionDto, TransactionFilterDto } from '../../dto';
import { WalletTransaction } from '../../entities/wallet-transaction.entity';

@Controller('admin/wallet')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADMIN)
export class WalletAdminController {
  constructor(private readonly walletAdminService: WalletAdminService) {}

  @Get('transactions/pending')
  getPendingTransactions(
    @Query() filter: TransactionFilterDto,
  ): Promise<WalletTransactionListResult> {
    return this.walletAdminService.getPendingTransactions(filter);
  }

  @Patch('transactions/:id/review')
  reviewTransaction(
    @Param('id') id: string,
    @Body() dto: ReviewTransactionDto,
  ): Promise<WalletTransaction> {
    return this.walletAdminService.reviewTransaction(id, dto);
  }
}
