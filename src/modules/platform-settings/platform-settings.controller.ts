import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformOptionsService } from './platform-options.service';
import { UpdatePlatformFeeDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { Platform } from '../../common/enums/platform.enum';

@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly platformOptionsService: PlatformOptionsService,
  ) {}

  @Get('platforms')
  async getActivePlatforms(): Promise<Platform[]> {
    return this.platformOptionsService.getActivePlatforms();
  }

  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN)
  @Get('fee')
  async getFee(): Promise<{ percentage: number }> {
    const percentage = await this.platformSettingsService.getPlatformFeePercentage();
    return { percentage };
  }

  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN)
  @Patch('fee')
  async updateFee(@Body() dto: UpdatePlatformFeeDto): Promise<{ percentage: number }> {
    const setting = await this.platformSettingsService.updatePlatformFeePercentage(dto.percentage);
    return { percentage: Number(setting.value) };
  }
}
