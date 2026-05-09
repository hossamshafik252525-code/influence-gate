import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums';
import { AdminOfferQueryService } from '../services/admin-offer-query.service';
import { AdminOfferReviewService } from '../services/admin-offer-review.service';
import { ReviewOfferDto } from '../dto';
import { PaginationDto } from '../../notifications/dto/pagination.dto';
import { GetAdminPendingOffersResult } from '../interfaces/admin-offer.interface';

@Controller('campaigns/admin')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADMIN)
export class AdminOfferController {
  constructor(
    private readonly adminOfferQueryService: AdminOfferQueryService,
    private readonly adminOfferReviewService: AdminOfferReviewService,
  ) {}

  @Get('applications/pending-offers')
  getPendingOfferApplications(
    @Query() query: PaginationDto,
  ): Promise<GetAdminPendingOffersResult> {
    return this.adminOfferQueryService.getPendingOfferApplications(
      query.page,
      query.limit,
    );
  }

  @Post('applications/:applicationId/review-offer')
  @HttpCode(HttpStatus.OK)
  reviewOffer(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: ReviewOfferDto,
  ): Promise<{ message: string }> {
    return this.adminOfferReviewService.reviewOffer(applicationId, dto);
  }
}
