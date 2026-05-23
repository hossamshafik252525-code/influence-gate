import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Statuses } from '../../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { AdvertiserInvitationService } from '../services/advertiser-invitation.service';

@Controller('campaigns/advertiser')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserInvitationController {
  constructor(
    private readonly advertiserInvitationService: AdvertiserInvitationService,
  ) {}

  @Post(':campaignId/invitations/:influencerId')
  async invite(
    @AuthUser() user: User,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('influencerId', ParseUUIDPipe) influencerId: string,
  ): Promise<{ message: string }> {
    await this.advertiserInvitationService.inviteInfluencer(
      user.id,
      campaignId,
      influencerId,
    );
    return { message: 'تم إرسال الدعوة بنجاح' };
  }
}
