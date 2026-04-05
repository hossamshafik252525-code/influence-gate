import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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
import { CampaignInvitationService } from '../services/campaign-invitation.service';
import { GetInfluencerCampaignsQueryDto, SubmitContentDto } from '../dto';
import { PaginationQueryDto } from '../../../common/dto';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.PENDING, UserStatus.CONFIRMED)
export class InfluencerCampaignController {
  constructor(
    private readonly influencerCampaignQueryService: InfluencerCampaignQueryService,
    private readonly campaignApplicationService: CampaignApplicationService,
    private readonly campaignContentSubmissionService: CampaignContentSubmissionService,
    private readonly campaignInvitationService: CampaignInvitationService,
  ) {}

  @Get()
  getCampaigns(
    @AuthUser() user: User,
    @Query() query: GetInfluencerCampaignsQueryDto,
  ) {
    return this.influencerCampaignQueryService.getCampaigns(user.id, query);
  }

  @Get('applications')
  getMyApplications(
    @AuthUser() user: User,
    @Query() query: PaginationQueryDto,
  ) {
    return this.influencerCampaignQueryService.getMyApplications(user.id, query);
  }

  @Get('applications/:id')
  getApplicationDetail(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.influencerCampaignQueryService.getApplicationDetail(id, user.id);
  }

  @Get('invitations')
  getMyInvitations(
    @AuthUser() user: User,
    @Query() query: PaginationQueryDto,
  ) {
    return this.influencerCampaignQueryService.getMyInvitations(user.id, query);
  }

  @Get(':id')
  getCampaignDetail(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.influencerCampaignQueryService.getCampaignDetail(id, user.id);
  }

  @Post(':id/apply')
  @Statuses(UserStatus.CONFIRMED)
  @HttpCode(HttpStatus.CREATED)
  applyToCampaign(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignApplicationService.applyToCampaign(user.id, id);
  }

  @Post(':id/submit')
  @Statuses(UserStatus.CONFIRMED)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AnyFilesInterceptor({ limits: { fileSize: 10 * 1024 * 1024, files: 5 } }))
  submitContent(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitContentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.campaignContentSubmissionService.submitContent(user.id, id, dto, files ?? []);
  }

  @Post('invitations/:campaignId/accept')
  @Statuses(UserStatus.CONFIRMED)
  @HttpCode(HttpStatus.CREATED)
  acceptInvitation(
    @AuthUser() user: User,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.campaignApplicationService.applyToCampaign(user.id, campaignId);
  }

  @Post('invitations/:campaignId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  rejectInvitation(
    @AuthUser() user: User,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.campaignInvitationService.rejectInvitation(user.id, campaignId);
  }
}
