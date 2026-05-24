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
import { ContentTypesService } from '../../content-types/content-types.service';
import { ContentTypesValidationService } from '../../content-types/content-types-validation.service';
import { ImplementationTypesService } from '../../implementation-types/implementation-types.service';
import { ImplementationTypesValidationService } from '../../implementation-types/implementation-types-validation.service';
import { PlatformsService } from '../../platforms/platforms.service';
import { PlatformsValidationService } from '../../platforms/platforms-validation.service';
import { CampaignQueryService } from './campaign-query.service';
import { CampaignValidationService } from './campaign-validation.service';
import { InvitationsManagementService } from '../invitations/services/invitations-management.service';
import { InvitationsDataService } from '../invitations/services/invitations-data.service';
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
    private readonly contentTypesService: ContentTypesService,
    private readonly contentTypesValidationService: ContentTypesValidationService,
    private readonly implementationTypesService: ImplementationTypesService,
    private readonly implementationTypesValidationService: ImplementationTypesValidationService,
    private readonly platformsService: PlatformsService,
    private readonly platformsValidationService: PlatformsValidationService,
    private readonly invitationsManagementService: InvitationsManagementService,
    private readonly invitationsDataService: InvitationsDataService,
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

    const implementationTypesValid =
      await this.implementationTypesValidationService.allActiveExist(
        dto.implementationTypeIds,
      );
    if (!implementationTypesValid) {
      throw new BadRequestException('أحد أنواع التنفيذ المحددة غير صالح');
    }
    const implementationTypes =
      await this.implementationTypesService.findByIds(dto.implementationTypeIds);

    const platformsValid = await this.platformsValidationService.allActiveExist(
      dto.platformIds,
    );
    if (!platformsValid) {
      throw new BadRequestException('إحدى المنصات المحددة غير صالحة');
    }
    const platforms = await this.platformsService.findByIds(dto.platformIds);

    await this.countriesService.findOne(dto.countryId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const applicationDeadlineDate = new Date(dto.applicationDeadlineDate);

    validateInitialDateOrdering(startDate, applicationDeadlineDate, endDate);

    campaign.name = dto.name;
    campaign.description = dto.description;
    campaign.categories = categories;
    campaign.countryId = dto.countryId;
    campaign.platforms = platforms;
    campaign.implementationTypes = implementationTypes;
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

    const contentTypesValid =
      await this.contentTypesValidationService.allActiveExist(dto.contentTypeIds);
    if (!contentTypesValid) {
      throw new BadRequestException('أحد أنواع المحتوى المحددة غير صالح');
    }
    const contentTypes = await this.contentTypesService.findByIds(
      dto.contentTypeIds,
    );

    campaign.contentTypes = contentTypes;
    campaign.contentDescription = dto.contentDescription;
    campaign.currentStep = CampaignStep.INFLUENCERS;

    if (dto.contentPdfUrl && dto.contentPdfPublicId) {
      if (campaign.contentPdfPublicId) {
        await this.cloudinaryService.deleteFile(campaign.contentPdfPublicId);
      }
      campaign.contentPdfUrl = dto.contentPdfUrl;
      campaign.contentPdfPublicId = dto.contentPdfPublicId;
    }

    await this.campaignRepository.save(campaign);

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

    if (campaign.campaignVisibility === CampaignVisibility.PRIVATE) {
      const invitationsTotalCost =
        await this.invitationsDataService.sumAllInvitationsCost(campaign.id);

      if (dto.budget < invitationsTotalCost) {
        throw new BadRequestException(
          'الميزانية يجب أن تكون مساوية أو أكبر من إجمالي تكلفة المؤثرين المدعوين',
        );
      }
    }

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
      relations: [
        'invitedInfluencers',
        'categories',
        'contentTypes',
        'implementationTypes',
        'platforms',
      ],
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
