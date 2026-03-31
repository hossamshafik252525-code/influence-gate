import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InfluencerServiceService } from '../services/influencer-service.service';
import { CreateInfluencerServiceDto, UpdateInfluencerServiceDto } from '../dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Statuses } from '../../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.ACTIVE)
@Controller('influencer/services')
export class InfluencerServiceController {
  constructor(private readonly influencerServiceService: InfluencerServiceService) {}

  @Post()
  create(@AuthUser() user: User, @Body() dto: CreateInfluencerServiceDto) {
    return this.influencerServiceService.create(user.id, dto);
  }

  @Get()
  findAll(@AuthUser() user: User) {
    return this.influencerServiceService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(@AuthUser() user: User, @Param('id') id: string) {
    return this.influencerServiceService.findOneByUser(id, user.id);
  }

  @Patch(':id')
  update(
    @AuthUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateInfluencerServiceDto,
  ) {
    return this.influencerServiceService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@AuthUser() user: User, @Param('id') id: string) {
    return this.influencerServiceService.remove(id, user.id);
  }
}
