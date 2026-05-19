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
import {
  InfluencerCard,
  InfluencersDiscoveryResult,
  InfluencersDiscoveryRawRow,
} from '../interfaces/influencer-card.interface';
import { InfluencerDetail } from '../interfaces/influencer-detail.interface';
import { InfluencerCardMapper } from '../mappers/influencer-card.mapper';
import { InfluencerDetailMapper } from '../mappers/influencer-detail.mapper';

@Controller('advertiser/influencers')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserInfluencerDiscoveryController {
  constructor(
    private readonly discoveryService: AdvertiserInfluencerDiscoveryService,
  ) {}

  @Get()
  async getInfluencers(
    @Query() query: GetInfluencersQueryDto,
  ): Promise<InfluencersDiscoveryResult> {
    const result = await this.discoveryService.getInfluencers(query);
    return {
      data: result.data.map((row) => this.toCard(row)),
      pagination: result.pagination,
    };
  }

  @Get(':id')
  async getInfluencerById(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<InfluencerDetail> {
    const result = await this.discoveryService.getInfluencerById(id, user.id);
    return InfluencerDetailMapper.toDetail({
      user: result.user,
      socialPlatforms: result.socialPlatforms,
      hasHistory: result.hasHistory,
      feeMultiplier: result.feeMultiplier,
    });
  }

  private toCard(row: InfluencersDiscoveryRawRow): InfluencerCard {
    const profile = row.user.influencerProfile;
    return InfluencerCardMapper.toCard({
      user: row.user,
      profile,
      totalFollowers: Number(profile.totalFollowers),
      feeMultiplier: row.feeMultiplier,
    });
  }
}
