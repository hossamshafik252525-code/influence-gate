import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { Role } from '../../common/enums';
import { User } from '../users/entities/user.entity';
import { WalletSummary } from './interfaces';

@Controller('influencer/wallet')
@UseGuards(JwtAuthGuard, AuthGuard)
@Roles(Role.INFLUENCER)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('summary')
  getSummary(@AuthUser() user: User): Promise<WalletSummary> {
    return this.walletService.getWalletSummary(user.id);
  }
}
