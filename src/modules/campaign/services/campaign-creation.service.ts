import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignStep, CampaignVisibility } from '../enums';
import {
  SaveCampaignInformationDto,
  SaveContentRequirementsDto,
  SaveInfluencerRequirementsDto,
  SaveCampaignBudgetDto,
} from '../dto';
import { CategoriesService } from '../../categories/categories.service';
import { CountriesService } from '../../countries/countries.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CampaignQueryService } from './campaign-query.service';
import { CampaignValidationService } from './campaign-validation.service';
import { InvitationsManagementService } from '../invitations/services/invitations-management.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { Role } from '../../../common/enums';
import { validateInitialDateOrdering } from '../utils';

@Injectable()
export class CampaignCreationService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly campaignQueryService: CampaignQueryService,
    private readonly campaignValidationService: CampaignValidationService,
    private readonly categoriesService: CategoriesService,
    private readonly countriesService: CountriesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly invitationsManagementService: InvitationsManagementService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createDraft(advertiserId: string): Promise<Campaign> {
    const existingDraft = await this.campaignRepository.findOne({
      where: { advertiserId, status: CampaignStatus.DRAFT },
    });

    if (existingDraft) {
      throw new BadRequestException('لديك مسودة حملة بالفعل. يرجى إكمالها أو حذفها أولاً');
    }

    const campaign = this.campaignRepository.create({ advertiserId });
    const saved = await this.campaignRepository.save(campaign);
    return this.campaignQueryService.findCampaignWithRelations(saved.id);
  }

  async saveInformation(
    campaignId: string,
    advertiserId: string,
    dto: SaveCampaignInformationDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignQueryService.findDraftOrFail(campaignId, advertiserId);

    const categories = await this.categoriesService.findByIds(dto.categoryIds);
    if (categories.length !== dto.categoryIds.length) {
      throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
    }

    await this.countriesService.findOne(dto.countryId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const applicationDeadlineDate = new Date(dto.applicationDeadlineDate);

    validateInitialDateOrdering(startDate, applicationDeadlineDate, endDate);

    campaign.name = dto.name;
    campaign.description = dto.description;
    campaign.categories = categories;
    campaign.countryId = dto.countryId;
    campaign.includedPlatforms = dto.includedPlatforms;
    campaign.implementationType = dto.implementationType;
    campaign.startDate = startDate;
    campaign.endDate = endDate;
    campaign.applicationDeadlineDate = applicationDeadlineDate;
    campaign.currentStep = CampaignStep.CONTENT;

    const saved = await this.campaignRepository.save(campaign);
    return this.campaignQueryService.findCampaignWithRelations(saved.id);
  }

  async saveContentRequirements(
    campaignId: string,
    advertiserId: string,
    dto: SaveContentRequirementsDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignQueryService.findDraftOrFail(campaignId, advertiserId);

    const updateData: Partial<Campaign> = {
      contentTypes: dto.contentTypes,
      contentDescription: dto.contentDescription,
      currentStep: CampaignStep.INFLUENCERS,
    };

    if (dto.contentPdfUrl && dto.contentPdfPublicId) {
      if (campaign.contentPdfPublicId) {
        await this.cloudinaryService.deleteFile(campaign.contentPdfPublicId);
      }
      updateData.contentPdfUrl = dto.contentPdfUrl;
      updateData.contentPdfPublicId = dto.contentPdfPublicId;
    }

    await this.campaignRepository.update(campaign.id, updateData);

    return this.campaignQueryService.findCampaignWithRelations(campaign.id);
  }

  async saveInfluencerRequirements(
    campaignId: string,
    advertiserId: string,
    dto: SaveInfluencerRequirementsDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignQueryService.findDraftOrFail(campaignId, advertiserId);

    const isPrivate = dto.campaignVisibility === CampaignVisibility.PRIVATE;

    if (!dto.requiredInfluencersCount || dto.requiredInfluencersCount < 1) {
      throw new BadRequestException('عدد المؤثرين مطلوب');
    }

    if (isPrivate) {
      if (!dto.invitedInfluencers || dto.invitedInfluencers.length === 0) {
        throw new BadRequestException('يجب اختيار مؤثرين للحملة الخاصة');
      }
      await this.invitationsManagementService.deleteInvitationsByCampaign(campaign.id);
      await this.invitationsManagementService.createInvitations(campaign.id, dto.invitedInfluencers);
    } else {
      await this.invitationsManagementService.deleteInvitationsByCampaign(campaign.id);
    }

    await this.campaignRepository.update(campaign.id, {
      campaignVisibility: dto.campaignVisibility,
      influencerType: dto.influencerType,
      currentStep: CampaignStep.BUDGET,
      requiredInfluencersCount: dto.requiredInfluencersCount,
    });

    return this.campaignQueryService.findCampaignWithRelations(campaign.id);
  }

  async saveBudget(
    campaignId: string,
    advertiserId: string,
    dto: SaveCampaignBudgetDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignQueryService.findDraftOrFail(campaignId, advertiserId);

    await this.campaignRepository.update(campaign.id, {
      budget: dto.budget,
      currentStep: CampaignStep.REVIEW,
    });

    return this.campaignQueryService.findCampaignWithRelations(campaign.id);
  }

  async submitForReview(
    campaignId: string,
    advertiserId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId, status: CampaignStatus.DRAFT },
      relations: ['invitedInfluencers', 'categories'],
    });

    if (!campaign) {
      throw new NotFoundException('المسودة غير موجودة');
    }

    this.campaignValidationService.assertAllStepsCompleted(campaign);

    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    });

    await this.notificationsService.notifyByRole(
      Role.ADMIN,
      'حملة جديدة للمراجعة',
      `تم تقديم حملة "${campaign.name}" للمراجعة`,
      NotificationType.CAMPAIGN_SUBMITTED_FOR_REVIEW,
      { campaignId: campaign.id },
    );

    return this.campaignQueryService.findCampaignWithRelations(campaign.id);
  }
}
