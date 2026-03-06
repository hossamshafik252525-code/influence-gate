import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SocialLinkingService } from './social-linking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { User } from './entities/user.entity';
import { MetaCallbackDto } from './dto';
import { Platform } from '../../common/enums';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly socialLinkingService: SocialLinkingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('social/meta/auth-url')
  getMetaAuthUrl() {
    return this.socialLinkingService.getMetaAuthUrl();
  }

  @UseGuards(JwtAuthGuard)
  @Get('social/meta/callback')
  handleMetaCallback(
    @Query() dto: MetaCallbackDto,
    @AuthUser() user: User,
  ) {
    return this.socialLinkingService.handleMetaCallback(dto.code, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('social/linked')
  getLinkedPlatforms(@AuthUser() user: User) {
    return this.socialLinkingService.getLinkedPlatforms(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('social/:platform/refresh')
  refreshStats(
    @AuthUser() user: User,
    @Param('platform') platform: Platform,
  ) {
    return this.socialLinkingService.refreshStats(user.id, platform);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('social/:platform')
  unlinkPlatform(
    @AuthUser() user: User,
    @Param('platform') platform: Platform,
  ) {
    return this.socialLinkingService.unlinkPlatform(user.id, platform);
  }
}
