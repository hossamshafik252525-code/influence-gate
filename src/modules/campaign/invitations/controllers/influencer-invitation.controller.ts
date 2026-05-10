import {
  Controller,
  Get,
  Post,
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
import { CampaignInvitationResponseService } from '../services/campaign-invitation-response.service';
import { InfluencerCampaignQueryService } from '../../services/influencer-campaign-query.service';
import { GetInfluencerInvitationsQueryDto } from '../dto/get-influencer-invitations-query.dto';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.PENDING, UserStatus.CONFIRMED)
export class InfluencerInvitationController {
  constructor(
    private readonly campaignInvitationResponseService: CampaignInvitationResponseService,
    @Inject(forwardRef(() => InfluencerCampaignQueryService))
    private readonly influencerCampaignQueryService: InfluencerCampaignQueryService,
  ) {}

  @Get('invitations')
  getInvitations(
    @AuthUser() user: User,
    @Query() query: GetInfluencerInvitationsQueryDto,
  ) {
    return this.influencerCampaignQueryService.getInvitations(user.id, query);
  }

  @Post('invitations/:invitationId/accept')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.OK)
  acceptInvitation(
    @AuthUser() user: User,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.campaignInvitationResponseService.acceptInvitation(user.id, invitationId);
  }

  @Post('invitations/:invitationId/reject')
  @Statuses(UserStatus.ACTIVE)
  @HttpCode(HttpStatus.OK)
  rejectInvitation(
    @AuthUser() user: User,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.campaignInvitationResponseService.rejectInvitation(user.id, invitationId);
  }
}
