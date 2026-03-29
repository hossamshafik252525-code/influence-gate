import { Controller, Get, UseGuards } from '@nestjs/common';
import { InfluencerProfileService } from '../services/influencer-profile.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';

@UseGuards(JwtAuthGuard, AuthGuard)
@Roles(Role.INFLUENCER)
@Controller('influencer/profile')
export class InfluencerProfileController {
  constructor(private readonly influencerProfileService: InfluencerProfileService) {}

  @Get()
  getProfile(@AuthUser() user: User) {
    return this.influencerProfileService.getProfile(user.id);
  }

  @Get('numbers')
  getNumbers(@AuthUser() user: User) {
    return this.influencerProfileService.getNumbers(user.id);
  }
}
