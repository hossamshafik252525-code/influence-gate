import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TikTokStrategy } from './tiktok.strategy';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { User } from '../../../users/entities/user.entity';
import { TikTokCallbackDto } from '../../dto/tiktok-callback.dto';

@Controller('social/tiktok')
@UseGuards(JwtAuthGuard)
export class TikTokController {
  constructor(private readonly tiktokStrategy: TikTokStrategy) {}

  @Get('auth-url')
  getAuthUrl() {
    return this.tiktokStrategy.getAuthUrl();
  }

  @Get('callback')
  handleCallback(@Query() dto: TikTokCallbackDto, @AuthUser() user: User) {
    return this.tiktokStrategy.handleCallback(dto.code, user.id);
  }
}
