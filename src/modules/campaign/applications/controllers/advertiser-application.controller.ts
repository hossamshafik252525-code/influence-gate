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
import { CampaignApplicationReviewService } from '../services/campaign-application-review.service';
import { AdvertiserApplicationQueryService } from '../services/advertiser-application-query.service';
import { ReviewApplicationDto } from '../dto/review-application.dto';
import { PaginationDto } from '../../../notifications/dto/pagination.dto';

@Controller('campaigns/advertiser')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserApplicationController {
  constructor(
    private readonly campaignApplicationReviewService: CampaignApplicationReviewService,
    private readonly advertiserApplicationQueryService: AdvertiserApplicationQueryService,
  ) {}

  @Get(':id/applications')
  getCampaignApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Query() query: PaginationDto,
  ) {
    return this.advertiserApplicationQueryService.getCampaignApplications(
      id,
      user.id,
      query.page,
      query.limit,
    );
  }

  @Patch('applications/:applicationId/review')
  reviewApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @AuthUser() user: User,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.campaignApplicationReviewService.reviewApplication(
      user.id,
      applicationId,
      dto,
    );
  }

}
