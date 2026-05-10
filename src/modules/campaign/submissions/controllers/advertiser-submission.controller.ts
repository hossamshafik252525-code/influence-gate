import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Statuses } from '../../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { CampaignSubmissionQueryService } from '../services/campaign-submission-query.service';
import { CampaignSubmissionReviewService } from '../services/campaign-submission-review.service';
import { ReviewSubmissionDto } from '../dto/review-submission.dto';
import { PaginationDto } from '../../../notifications/dto/pagination.dto';

@Controller('campaigns/advertiser')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserSubmissionController {
  constructor(
    private readonly campaignSubmissionQueryService: CampaignSubmissionQueryService,
    private readonly campaignSubmissionReviewService: CampaignSubmissionReviewService,
  ) {}

  @Get(':id/submissions')
  getCampaignSubmissions(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Query() query: PaginationDto,
  ) {
    return this.campaignSubmissionQueryService.getSubmissions(
      user.id,
      id,
      query.page,
      query.limit,
    );
  }

  @Patch('submissions/:submissionId/review')
  reviewSubmission(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @AuthUser() user: User,
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.campaignSubmissionReviewService.reviewSubmission(user.id, submissionId, dto);
  }
}
