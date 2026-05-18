import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AdvertiserProfileQueryService } from '../services/advertiser-profile-query.service';
import { AdvertiserProfileManagementService } from '../services/advertiser-profile-management.service';
import { AdvertiserProfileMapper } from '../mappers/advertiser-profile.mapper';
import {
  ConfirmAdvertiserProfileDto,
  UpdateAdvertiserProfileDto,
} from '../dto';
import { AdvertiserProfileData } from '../../interfaces';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';

@Controller('advertiser/profile')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
export class AdvertiserProfileController {
  constructor(
    private readonly advertiserProfileQueryService: AdvertiserProfileQueryService,
    private readonly advertiserProfileManagementService: AdvertiserProfileManagementService,
  ) {}

  @Post('confirm')
  async confirmProfile(
    @AuthUser() user: User,
    @Body() dto: ConfirmAdvertiserProfileDto,
  ) {
    const profile =
      await this.advertiserProfileManagementService.confirmProfile(
        user.id,
        dto,
      );
    return AdvertiserProfileMapper.toProfileData(profile);
  }

  @Get()
  async getProfile(@AuthUser() user: User): Promise<AdvertiserProfileData> {
    const profile = await this.advertiserProfileQueryService.getProfile(
      user.id,
    );
    return AdvertiserProfileMapper.toProfileData(profile);
  }

  @Patch()
  async updateProfile(
    @AuthUser() user: User,
    @Body() dto: UpdateAdvertiserProfileDto,
  ): Promise<AdvertiserProfileData> {
    await this.advertiserProfileManagementService.updateProfile(user.id, dto);
    const profile = await this.advertiserProfileQueryService.getProfile(
      user.id,
    );
    return AdvertiserProfileMapper.toProfileData(profile);
  }
}
