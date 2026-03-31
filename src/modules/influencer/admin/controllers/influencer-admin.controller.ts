import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Role } from '../../../../common/enums';
import { InfluencerAdminService } from '../services/influencer-admin.service';
import { PaginationQueryDto } from '../../../../common/dto';

@Controller('admin/influencers')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADMIN)
export class InfluencerAdminController {
  constructor(private readonly influencerAdminService: InfluencerAdminService) {}

  @Get('pending')
  getPendingInfluencers(@Query() query: PaginationQueryDto) {
    return this.influencerAdminService.getPendingInfluencers(query);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  confirmInfluencer(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.influencerAdminService.confirmInfluencer(id);
  }
}
