import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Statuses } from '../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { CampaignReportQueryService } from '../services/campaign-report-query.service';
import { GetAdvertiserReportsQueryDto } from '../dto';
import { AdvertiserReportsResponse } from '../interfaces';

@Controller('reports/advertiser')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserReportController {
  constructor(
    private readonly campaignReportQueryService: CampaignReportQueryService,
  ) {}

  @Get()
  getMyReports(
    @AuthUser() user: User,
    @Query() query: GetAdvertiserReportsQueryDto,
  ): Promise<AdvertiserReportsResponse> {
    return this.campaignReportQueryService.getAdvertiserReports(user.id, query);
  }
}
