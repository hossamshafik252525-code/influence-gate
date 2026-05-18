import { Injectable, BadRequestException } from '@nestjs/common';
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
import { CategoriesValidationService } from '../../categories/categories-validation.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CampaignQueryService } from './campaign-query.service';
import { InvitationsManagementService } from '../invitations/services/invitations-management.service';

@Injectable()
export class CampaignCreationService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly campaignQueryService: CampaignQueryService,
    private readonly categoriesValidationService: CategoriesValidationService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly invitationsManagementService: InvitationsManagementService,
  ) {}

  async createDraft(advertiserId: string): Promise<Campaign> {
    const existingDraft = await this.campaignRepository.findOne({
      where: { advertiserId, status: CampaignStatus.DRAFT },
    });

    if (existingDraft) {
      throw new BadRequestException('لديك مسودة حملة بالفعل. يرجى إكمالها أو حذفها أولاً');
    }

    const campaign = this.campaignRepository.create({ advertiserId });
    return this.campaignRepository.save(campaign);
  }

  async saveInformation(
    campaignId: string,
    advertiserId: string,
    dto: SaveCampaignInformationDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignQueryService.findDraftOrFail(campaignId, advertiserId);

    const valid = await this.categoriesValidationService.allExist(dto.categoryIds);
    if (!valid) {
      throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
    }

    const updateData: Partial<Campaign> = {
      name: dto.name,
      description: dto.description,
      categoryIds: dto.categoryIds,
      includedPlatforms: dto.includedPlatforms,
      implementationType: dto.implementationType,
      campaignVisibility: dto.campaignVisibility,
      implementationPeriodDays: dto.implementationPeriodDays,
      currentStep: CampaignStep.CONTENT,
    };

    if (dto.campaignVisibility === CampaignVisibility.PUBLIC) {
      const deadlineDate = new Date(dto.deadlineDate);
      if (deadlineDate <= new Date()) {
        throw new BadRequestException('تاريخ الموعد النهائي يجب أن يكون في المستقبل');
      }
      updateData.deadlineDate = deadlineDate;
    } else {
      updateData.deadlineDate = null;
    }

    await this.campaignRepository.update(campaign.id, updateData);

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
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

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  async saveInfluencerRequirements(
    campaignId: string,
    advertiserId: string,
    dto: SaveInfluencerRequirementsDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignQueryService.findDraftOrFail(campaignId, advertiserId);

    if (!campaign.campaignVisibility) {
      throw new BadRequestException('يجب إكمال خطوة المعلومات أولاً');
    }

    const isPrivate = campaign.campaignVisibility === CampaignVisibility.PRIVATE;

    if (!dto.requiredInfluencersCount || dto.requiredInfluencersCount < 1) {
      throw new BadRequestException('عدد المؤثرين مطلوب');
    }

    if (isPrivate) {
      if (!dto.invitedInfluencers || dto.invitedInfluencers.length === 0) {
        throw new BadRequestException('يجب اختيار مؤثرين للحملة الخاصة');
      }
      await this.invitationsManagementService.deleteInvitationsByCampaign(campaign.id);
      await this.invitationsManagementService.createInvitations(campaign.id, dto.invitedInfluencers);
    }

    const updateData: Partial<Campaign> = {
      influencerType: dto.influencerType,
      currentStep: CampaignStep.BUDGET,
      requiredInfluencersCount: dto.requiredInfluencersCount,
    };

    if (isPrivate) {
      updateData.budget = null;
    }

    await this.campaignRepository.update(campaign.id, updateData);

    const updated = await this.campaignRepository.findOne({
      where: { id: campaign.id },
      relations: [
        'invitedInfluencers',
        'invitedInfluencers.influencer',
        'invitedInfluencers.influencer.influencerProfile',
      ],
    });

    return updated;
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

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

}
