import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
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
  getAuthUrl(): { url: string } {
    return this.tiktokStrategy.getAuthUrl();
  }

  @Post('link')
  handleLink(@Body() dto: TikTokCallbackDto, @AuthUser() user: User): Promise<import('../../entities/social-platform.entity').SocialPlatform[]> {
    return this.tiktokStrategy.handleCallback(dto.code, user.id);
  }
}
