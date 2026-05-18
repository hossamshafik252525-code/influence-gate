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
import { InfluencerProfileQueryService } from '../services/influencer-profile-query.service';
import { InfluencerProfileManagementService } from '../services/influencer-profile-management.service';
import { InfluencerProfileMapper } from '../mappers/influencer-profile.mapper';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { UpdateInfluencerProfileDto, ChangePasswordDto } from '../dto';
import { InfluencerProfileData, InfluencerNumbers } from '../../interfaces';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Controller('influencer/profile')
export class InfluencerProfileController {
  constructor(
    private readonly influencerProfileQueryService: InfluencerProfileQueryService,
    private readonly influencerProfileManagementService: InfluencerProfileManagementService,
  ) {}

  @Get()
  async getProfile(@AuthUser() user: User): Promise<InfluencerProfileData> {
    const profile = await this.influencerProfileQueryService.getProfile(user.id);
    return InfluencerProfileMapper.toProfileData(profile);
  }

  @Get('numbers')
  async getNumbers(@AuthUser() user: User): Promise<InfluencerNumbers> {
    const raw = await this.influencerProfileQueryService.getNumbers(user.id);
    return InfluencerProfileMapper.toNumbers(raw);
  }

  @Patch()
  async updateProfile(
    @AuthUser() user: User,
    @Body() dto: UpdateInfluencerProfileDto,
  ): Promise<InfluencerProfileData> {
    await this.influencerProfileManagementService.updateProfile(user.id, dto);
    const profile = await this.influencerProfileQueryService.getProfile(user.id);
    return InfluencerProfileMapper.toProfileData(profile);
  }

  @Delete('image')
  @HttpCode(HttpStatus.OK)
  async deleteProfileImage(@AuthUser() user: User): Promise<{ message: string }> {
    await this.influencerProfileManagementService.deleteProfileImage(user.id);
    return { message: 'تم حذف الصورة بنجاح' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @AuthUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.influencerProfileManagementService.changePassword(user.id, dto);
  }
}
