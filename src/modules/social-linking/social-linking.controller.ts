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


@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialLinkingController {
  constructor(private readonly socialLinkingService: SocialLinkingService) {}

  @Get('linked')
  getLinkedPlatforms(@AuthUser() user: User) {
    return this.socialLinkingService.getLinkedPlatforms(user.id);
  }

  @Post(':id/refresh')
  refreshStats(
    @AuthUser() user: User,
    @Param('id') id: string,
  ) {
    return this.socialLinkingService.refreshPlatformStats(user.id, id);
  }

  @Delete(':id')
  unlinkPlatform(
    @AuthUser() user: User,
    @Param('id') id: string,
  ) {
    return this.socialLinkingService.unlinkPlatform(user.id, id);
  }
}
