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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Statuses } from '../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { InfluencerCampaignQueryService } from '../services/influencer-campaign-query.service';
import { CampaignApplicationService } from '../services/campaign-application.service';
import { CampaignContentSubmissionService } from '../services/campaign-content-submission.service';
import { CampaignInvitationResponseService } from '../services/campaign-invitation-response.service';
import { CampaignApplicationWithdrawalService } from '../services/campaign-application-withdrawal.service';
import {
  GetNewCampaignsQueryDto,
  GetInfluencerMyCampaignsQueryDto,
  GetInfluencerApplicationsQueryDto,
  GetInfluencerInvitationsQueryDto,
  SubmitContentDto,
} from '../dto';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.PENDING, UserStatus.CONFIRMED)
export class InfluencerCampaignController {
  constructor(
    private readonly influencerCampaignQueryService: InfluencerCampaignQueryService,
    private readonly campaignApplicationService: CampaignApplicationService,
    private readonly campaignContentSubmissionService: CampaignContentSubmissionService,
    private readonly campaignInvitationResponseService: CampaignInvitationResponseService,
    private readonly campaignApplicationWithdrawalService: CampaignApplicationWithdrawalService,
  ) {}

  @Get('new')
  getNewCampaigns(
    @AuthUser() user: User,
    @Query() query: GetNewCampaignsQueryDto,
  ) {
    return this.influencerCampaignQueryService.getNewCampaigns(user.id, query);
  }

  @Get('my')
  getMyCampaigns(
    @AuthUser() user: User,
    @Query() query: GetInfluencerMyCampaignsQueryDto,
  ) {
    return this.influencerCampaignQueryService.getMyCampaigns(user.id, query);
  }

  @Get('applications')
  getApplications(
    @AuthUser() user: User,
    @Query() query: GetInfluencerApplicationsQueryDto,
  ) {
    return this.influencerCampaignQueryService.getApplications(user.id, query);
  }

  @Get('invitations')
  getInvitations(
    @AuthUser() user: User,
    @Query() query: GetInfluencerInvitationsQueryDto,
  ) {
    return this.influencerCampaignQueryService.getInvitations(user.id, query);
  }

  @Post('invitations/:campaignId/accept')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.OK)
  acceptInvitation(
    @AuthUser() user: User,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.campaignInvitationResponseService.acceptInvitation(user.id, campaignId);
  }

  @Post('invitations/:campaignId/reject')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.OK)
  rejectInvitation(
    @AuthUser() user: User,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.campaignInvitationResponseService.rejectInvitation(user.id, campaignId);
  }

  @Post(':id/apply')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.CREATED)
  applyToCampaign(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignApplicationService.applyToCampaign(user.id, id);
  }

  @Post(':id/submit')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.CREATED)
  submitContent(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitContentDto,
  ) {
    return this.campaignContentSubmissionService.submitContent(user.id, id, dto);
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

  @Get(':id')
  getCampaignDetail(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.influencerCampaignQueryService.getCampaignDetail(id, user.id);
  }
}
