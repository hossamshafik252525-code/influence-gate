import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Statuses } from '../../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { CampaignContentSubmissionService } from '../services/campaign-content-submission.service';
import { SubmitContentDto } from '../dto/submit-content.dto';

@Controller('campaigns/influencer')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER)
@Statuses(UserStatus.ACTIVE)
export class InfluencerSubmissionController {
  constructor(
    private readonly campaignContentSubmissionService: CampaignContentSubmissionService,
  ) {}

  @Post(':id/submit')
  @HttpCode(HttpStatus.CREATED)
  submitContent(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitContentDto,
  ) {
    return this.campaignContentSubmissionService.submitContent(user.id, id, dto);
  }
}
