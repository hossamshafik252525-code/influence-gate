import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SocialLinkingService } from './social-linking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { Platform } from '../../common/enums';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialLinkingController {
  constructor(private readonly socialLinkingService: SocialLinkingService) {}

  @Get('linked')
  getLinkedPlatforms(@AuthUser() user: User) {
    return this.socialLinkingService.getLinkedPlatforms(user.id);
  }

  @Post(':platform/refresh')
  refreshStats(
    @AuthUser() user: User,
    @Param('platform') platform: Platform,
  ) {
    return this.socialLinkingService.refreshPlatformStats(user.id, platform);
  }

  @Delete(':platform')
  unlinkPlatform(
    @AuthUser() user: User,
    @Param('platform') platform: Platform,
  ) {
    return this.socialLinkingService.unlinkPlatform(user.id, platform);
  }
}
