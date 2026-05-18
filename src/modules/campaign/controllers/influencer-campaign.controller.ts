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
import { CampaignQueryService } from '../services/campaign-query.service';
import { InfluencerCampaignMapper } from '../mappers';
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
    private readonly campaignQueryService: CampaignQueryService,
  ) {}

  @Get('new')
  async getNewCampaigns(
    @AuthUser() user: User,
    @Query() query: GetNewCampaignsQueryDto,
  ) {
    const result = await this.campaignQueryService.getNewCampaigns(user.id, query);
    return {
      data: result.data.map((c) => InfluencerCampaignMapper.toNewCampaignListItem(c)),
      pagination: result.pagination,
    };
  }

  @Get('my')
  async getMyCampaigns(
    @AuthUser() user: User,
    @Query() query: GetInfluencerMyCampaignsQueryDto,
  ) {
    const result = await this.campaignQueryService.getInfluencerCampaigns(user.id, query);
    return {
      data: result.data.map((c) => InfluencerCampaignMapper.toMyCampaignListItem(c)),
      pagination: result.pagination,
    };
  }

  @Get('details/:id')
  async getCampaignDetail(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const raw = await this.campaignQueryService.getCampaignDetail(id, user.id);
    return InfluencerCampaignMapper.toCampaignDetail(raw.campaign, raw.application, raw.submission, raw.invitation);
  }
}
