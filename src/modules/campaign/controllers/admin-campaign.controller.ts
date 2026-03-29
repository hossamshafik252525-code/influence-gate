import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums';
import { CampaignReviewService } from '../services/campaign-review.service';
import { ReviewCampaignDto } from '../dto';
import { Campaign } from '../entities/campaign.entity';

@Controller('campaigns/admin')
@UseGuards(JwtAuthGuard, AuthGuard)
@Roles(Role.ADMIN)
export class AdminCampaignController {
  constructor(private readonly campaignReviewService: CampaignReviewService) {}

  @Get('pending')
  getPendingCampaigns(): Promise<Campaign[]> {
    return this.campaignReviewService.getPendingCampaigns();
  }

  @Post(':id/review')
  reviewCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewCampaignDto,
  ): Promise<Campaign> {
    return this.campaignReviewService.reviewCampaign(id, dto);
  }
}
