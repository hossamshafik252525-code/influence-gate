import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ConfirmedUserGuard } from '../../../common/guards/confirmed-user.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, RolesGuard, ConfirmedUserGuard)
@Roles(Role.INFLUENCER)
export class InfluencerCampaignController {}
