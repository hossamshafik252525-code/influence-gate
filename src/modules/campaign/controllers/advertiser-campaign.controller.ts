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
import { CampaignDraftService } from '../services/campaign-draft.service';
import { CampaignManagementService } from '../services/campaign-management.service';
import { CampaignLaunchService } from '../services/campaign-launch.service';
import { CampaignQueryService } from '../services/campaign-query.service';
import { AdvertiserCampaignMapper } from '../mappers/advertiser-campaign.mapper';
import {
  SaveCampaignInformationDto,
  SaveContentRequirementsDto,
  SaveInfluencerRequirementsDto,
  SaveCampaignBudgetDto,
  UpdateCampaignDatesDto,
  UpdateCampaignBudgetDto,
  UpdateRequiredInfluencersDto,
  GetAdvertiserMyCampaignsQueryDto,
} from '../dto';
import { AdvertiserCampaignDetail } from '../interfaces/advertiser-campaign.interface';

@Controller('campaigns/advertiser')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Statuses(UserStatus.CONFIRMED)
export class AdvertiserCampaignController {
  constructor(
    private readonly campaignCreationService: CampaignCreationService,
    private readonly campaignDraftService: CampaignDraftService,
    private readonly campaignManagementService: CampaignManagementService,
    private readonly campaignLaunchService: CampaignLaunchService,
    private readonly campaignQueryService: CampaignQueryService,
  ) {}

  @Post('draft')
  async createDraft(@AuthUser() user: User): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignCreationService.createDraft(user.id);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Delete(':id/draft')
  deleteDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<void> {
    return this.campaignDraftService.deleteDraft(id, user.id);
  }

  @Get('my')
  async getMyCampaigns(
    @AuthUser() user: User,
    @Query() query: GetAdvertiserMyCampaignsQueryDto,
  ) {
    const { campaigns, total } =
      await this.campaignQueryService.getAdvertiserCampaigns(user.id, query);
    return {
      data: campaigns.map((c) =>
        AdvertiserCampaignMapper.toCampaignListItem(c),
      ),
      pagination: { total, page: query.page, limit: query.limit },
    };
  }

  @Get(':id')
  async getCampaignById(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignQueryService.findCampaignWithRelations(id, user.id);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Patch(':id/step/information')
  async saveInformation(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: SaveCampaignInformationDto,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignCreationService.saveInformation(id, user.id, dto);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Patch(':id/step/content')
  async saveContentRequirements(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: SaveContentRequirementsDto,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignCreationService.saveContentRequirements(id, user.id, dto);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Patch(':id/step/influencers')
  async saveInfluencerRequirements(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: SaveInfluencerRequirementsDto,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignCreationService.saveInfluencerRequirements(id, user.id, dto);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Patch(':id/step/budget')
  async saveBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: SaveCampaignBudgetDto,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignCreationService.saveBudget(id, user.id, dto);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Post(':id/submit')
  async submitForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignCreationService.submitForReview(id, user.id);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Patch(':id/dates')
  async updateDates(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: UpdateCampaignDatesDto,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignManagementService.updateDates(id, user.id, dto);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Patch(':id/budget')
  async updateBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: UpdateCampaignBudgetDto,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignManagementService.updateBudget(id, user.id, dto);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Patch(':id/required-influencers')
  async updateRequiredInfluencers(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
    @Body() dto: UpdateRequiredInfluencersDto,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignManagementService.updateRequiredInfluencersCount(
      id,
      user.id,
      dto,
    );
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }

  @Post(':id/launch')
  async launch(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: User,
  ): Promise<AdvertiserCampaignDetail> {
    const campaign = await this.campaignLaunchService.launchOnDemand(id, user.id);
    return AdvertiserCampaignMapper.toCampaignDetail(campaign);
  }
}
