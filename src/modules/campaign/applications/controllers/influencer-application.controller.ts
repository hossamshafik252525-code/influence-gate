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
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Statuses } from '../../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { CampaignApplicationService } from '../services/campaign-application.service';
import { CampaignApplicationWithdrawalService } from '../services/campaign-application-withdrawal.service';
import { InfluencerCampaignQueryService } from '../../services/influencer-campaign-query.service';
import { ApplyToCampaignDto } from '../dto/apply-to-campaign.dto';
import { GetInfluencerApplicationsQueryDto } from '../dto/get-influencer-applications-query.dto';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.PENDING, UserStatus.CONFIRMED)
export class InfluencerApplicationController {
  constructor(
    private readonly campaignApplicationService: CampaignApplicationService,
    private readonly campaignApplicationWithdrawalService: CampaignApplicationWithdrawalService,
    @Inject(forwardRef(() => InfluencerCampaignQueryService))
    private readonly influencerCampaignQueryService: InfluencerCampaignQueryService,
  ) {}

  @Get('applications')
  getApplications(
    @AuthUser() user: User,
    @Query() query: GetInfluencerApplicationsQueryDto,
  ) {
    console.log("test get applicaoins")
    return this.influencerCampaignQueryService.getApplications(user.id, query);
  }

  @Post(':id/apply')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.CREATED)
  applyToCampaign(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyToCampaignDto,
  ) {
    return this.campaignApplicationService.applyToCampaign(user.id, id, dto.offer);
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
