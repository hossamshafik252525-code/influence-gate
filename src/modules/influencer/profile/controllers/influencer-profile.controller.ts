import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InfluencerProfileService } from '../services/influencer-profile.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { UpdateInfluencerProfileDto, ChangePasswordDto } from '../dto';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Controller('influencer/profile')
export class InfluencerProfileController {
  constructor(
    private readonly influencerProfileService: InfluencerProfileService,
  ) {}

  @Get()
  getProfile(@AuthUser() user: User) {
    return this.influencerProfileService.getProfile(user.id);
  }

  @Get('numbers')
  getNumbers(@AuthUser() user: User) {
    return this.influencerProfileService.getNumbers(user.id);
  }

  @Patch()
  updateProfile(
    @AuthUser() user: User,
    @Body() dto: UpdateInfluencerProfileDto,
  ) {
    return this.influencerProfileService.updateProfile(user.id, dto);
  }

  @Delete('image')
  deleteProfileImage(@AuthUser() user: User) {
    return this.influencerProfileService.deleteProfileImage(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @AuthUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.influencerProfileService.changePassword(user.id, dto);
  }
}
