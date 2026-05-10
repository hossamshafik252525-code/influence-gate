import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Statuses } from '../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { CampaignCreationService } from '../services/campaign-creation.service';
import { CampaignSubmissionService } from '../services/campaign-submission.service';
import { CampaignLifecycleService } from '../services/campaign-lifecycle.service';
import { CampaignQueryService } from '../services/campaign-query.service';
import {
  SaveCampaignInformationDto,
  SaveContentRequirementsDto,
  SaveInfluencerRequirementsDto,
  SaveCampaignBudgetDto,
  ResolvePendingMinimumDto,
  GetMyCampaignsQueryDto,
} from '../dto';
import { Campaign } from '../entities/campaign.entity';
import { AdvertiserCampaignResult } from '../interfaces/advertiser-campaign.interface';

@Controller('campaigns/advertiser')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserCampaignController {
  constructor(
    private readonly campaignCreationService: CampaignCreationService,
    private readonly campaignSubmissionService: CampaignSubmissionService,
    private readonly campaignLifecycleService: CampaignLifecycleService,
    private readonly campaignQueryService: CampaignQueryService,
  ) {}

  @Post('draft')
  createDraft(@AuthUser() user: User): Promise<Campaign> {
    return this.campaignCreationService.createDraft(user.id);
  }

  @Delete(':id/draft')
  deleteDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<void> {
    return this.campaignCreationService.deleteDraft(id, user.id);
  }

  @Get('my')
  getMyCampaigns(
    @AuthUser() user: User,
    @Query() query: GetMyCampaignsQueryDto,
  ) {
    return this.campaignQueryService.getMyCampaigns(user.id, query);
  }

  @Get(':id')
  getCampaignById(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<Campaign> {
    return this.campaignQueryService.getCampaignById(id, user.id);
  }

  @Patch(':id/step/information')
  saveInformation(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: SaveCampaignInformationDto,
  ): Promise<Campaign> {
    return this.campaignCreationService.saveInformation(id, user.id, dto);
  }

  @Patch(':id/step/content')
  saveContentRequirements(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: SaveContentRequirementsDto,
  ): Promise<Campaign> {
    return this.campaignCreationService.saveContentRequirements(id, user.id, dto);
  }

  @Patch(':id/step/influencers')
  saveInfluencerRequirements(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: SaveInfluencerRequirementsDto,
  ): Promise<AdvertiserCampaignResult> {
    return this.campaignCreationService.saveInfluencerRequirements(
      id,
      user.id,
      dto,
    );
  }

  @Patch(':id/step/budget')
  saveBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: SaveCampaignBudgetDto,
  ): Promise<Campaign> {
    return this.campaignCreationService.saveBudget(id, user.id, dto);
  }

  @Post(':id/submit')
  submitForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<Campaign> {
    return this.campaignSubmissionService.submitForReview(id, user.id);
  }

  @Post(':id/resolve-pending')
  resolvePendingMinimum(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: ResolvePendingMinimumDto,
  ): Promise<Campaign> {
    return this.campaignLifecycleService.resolvePendingMinimum(
      id,
      user.id,
      dto,
    );
  }
}
