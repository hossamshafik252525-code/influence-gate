import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SnapchatStrategy } from './snapchat.strategy';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { User } from '../../../users/entities/user.entity';
import { SnapchatCallbackDto } from '../../dto/snapchat-callback.dto';

@Controller('social/snapchat')
@UseGuards(JwtAuthGuard)
export class SnapchatController {
  constructor(private readonly snapchatStrategy: SnapchatStrategy) {}

  @Get('auth-url')
  getAuthUrl() {
    return this.snapchatStrategy.getAuthUrl();
  }

  @Get('callback')
  handleCallback(@Query() dto: SnapchatCallbackDto, @AuthUser() user: User) {
    return this.snapchatStrategy.handleCallback(dto.code, user.id);
  }
}
