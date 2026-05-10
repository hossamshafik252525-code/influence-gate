import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Statuses } from '../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { InfluencerCampaignQueryService } from '../services/influencer-campaign-query.service';
import {
  GetNewCampaignsQueryDto,
  GetInfluencerMyCampaignsQueryDto,
} from '../dto';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.PENDING, UserStatus.CONFIRMED)
export class InfluencerCampaignController {
  constructor(
    private readonly influencerCampaignQueryService: InfluencerCampaignQueryService,
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

  @Get('details/:id')
  getCampaignDetail(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.influencerCampaignQueryService.getCampaignDetail(id, user.id);
  }
}
