import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Statuses } from '../../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { ApplicationsManagementService } from '../services/applications-management.service';
import { CampaignApplicationWithdrawalService } from '../services/campaign-application-withdrawal.service';
import { InfluencerApplicationQueryService } from '../services/influencer-application-query.service';
import { InfluencerApplicationMapper } from '../mappers/influencer-application.mapper';
import { ApplyToCampaignDto } from '../dto/apply-to-campaign.dto';
import { GetInfluencerApplicationsQueryDto } from '../dto/get-influencer-applications-query.dto';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.PENDING, UserStatus.CONFIRMED)
export class InfluencerApplicationController {
  constructor(
    private readonly applicationsManagementService: ApplicationsManagementService,
    private readonly campaignApplicationWithdrawalService: CampaignApplicationWithdrawalService,
    private readonly influencerApplicationQueryService: InfluencerApplicationQueryService,
  ) {}

  @Get('applications')
  async getApplications(
    @AuthUser() user: User,
    @Query() query: GetInfluencerApplicationsQueryDto,
  ) {
    const result = await this.influencerApplicationQueryService.getApplications(user.id, query);
    return {
      data: result.data.map((a) => InfluencerApplicationMapper.toApplicationListItem(a, a.campaign)),
      pagination: result.pagination,
    };
  }

  @Post(':id/apply')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.CREATED)
  applyToCampaign(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyToCampaignDto,
  ) {
    return this.applicationsManagementService.createApplication(user.id, id, dto.offer);
  }

  @Post(':id/exit')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.OK)
  exitCampaign(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignApplicationWithdrawalService.withdrawApplication(user.id, id);
  }
}
