import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformFeeDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@Controller('platform-settings')
@UseGuards(JwtAuthGuard, AuthGuard)
@Roles(Role.ADMIN)
export class PlatformSettingsController {
  constructor(private readonly platformSettingsService: PlatformSettingsService) {}

  @Get('fee')
  async getFee(): Promise<{ percentage: number }> {
    const percentage = await this.platformSettingsService.getPlatformFeePercentage();
    return { percentage };
  }

  @Patch('fee')
  async updateFee(@Body() dto: UpdatePlatformFeeDto): Promise<{ percentage: number }> {
    const setting = await this.platformSettingsService.updatePlatformFeePercentage(dto.percentage);
    return { percentage: Number(setting.value) };
  }
}
