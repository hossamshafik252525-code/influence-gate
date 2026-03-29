import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Statuses } from '../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { InfluencerCampaignQueryService } from '../services/influencer-campaign-query.service';
import { GetInfluencerCampaignsQueryDto } from '../dto';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, AuthGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.PENDING, UserStatus.ACTIVE)
export class InfluencerCampaignController {
  constructor(
    private readonly influencerCampaignQueryService: InfluencerCampaignQueryService,
  ) {}

  @Get()
  getCampaigns(
    @AuthUser() user: User,
    @Query() query: GetInfluencerCampaignsQueryDto,
  ) {
    return this.influencerCampaignQueryService.getCampaigns(user.id, query);
  }

  @Get(':id')
  getCampaignDetail(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.influencerCampaignQueryService.getCampaignDetail(id, user.id);
  }
}
