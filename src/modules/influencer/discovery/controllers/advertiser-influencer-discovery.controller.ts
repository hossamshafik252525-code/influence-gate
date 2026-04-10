import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Statuses } from '../../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { AdvertiserInfluencerDiscoveryService } from '../services/advertiser-influencer-discovery.service';
import { GetInfluencersQueryDto } from '../dto/get-influencers-query.dto';
import { InfluencersDiscoveryResult } from '../interfaces/influencer-card.interface';
import { InfluencerDetail } from '../interfaces/influencer-detail.interface';

@Controller('advertiser/influencers')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserInfluencerDiscoveryController {
  constructor(
    private readonly discoveryService: AdvertiserInfluencerDiscoveryService,
  ) {}

  @Get()
  getInfluencers(
    @Query() query: GetInfluencersQueryDto,
  ): Promise<InfluencersDiscoveryResult> {
    return this.discoveryService.getInfluencers(query);
  }

  @Get(':id')
  getInfluencerById(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<InfluencerDetail> {
    return this.discoveryService.getInfluencerById(id, user.id);
  }
}
