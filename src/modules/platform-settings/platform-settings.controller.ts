import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformFeeDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

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
