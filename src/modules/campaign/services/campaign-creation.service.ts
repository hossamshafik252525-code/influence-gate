import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignStatus, CampaignStep, CampaignVisibility } from '../enums';
import {
  SaveCampaignInformationDto,
  SaveContentRequirementsDto,
  SaveInfluencerRequirementsDto,
  SaveCampaignBudgetDto,
} from '../dto';
import { CategoriesService } from '../../categories/categories.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { UsersService } from '../../users/users.service';
import { Role } from '../../../common/enums';

@Injectable()
export class CampaignCreationService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitedInfluencerRepository: Repository<CampaignInvitedInfluencer>,
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UsersService,
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

  async deleteDraft(campaignId: string, advertiserId: string): Promise<void> {
    const campaign = await this.findDraftOrFail(campaignId, advertiserId);

    if (campaign.contentPdfPublicId) {
      await this.cloudinaryService.deleteFile(campaign.contentPdfPublicId);
    }

    await this.invitedInfluencerRepository.delete({ campaignId: campaign.id });
    await this.campaignRepository.remove(campaign);
  }

  async saveInformation(
    campaignId: string,
    advertiserId: string,
    dto: SaveCampaignInformationDto,
  ): Promise<Campaign> {
    const campaign = await this.findDraftOrFail(campaignId, advertiserId);

    await this.categoriesService.findOne(dto.categoryId);

    const deadlineDate = new Date(dto.deadlineDate);
    if (deadlineDate <= new Date()) {
      throw new BadRequestException('تاريخ الموعد النهائي يجب أن يكون في المستقبل');
    }

    await this.campaignRepository.update(campaign.id, {
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      includedPlatforms: dto.includedPlatforms,
      implementationType: dto.implementationType,
      deadlineDate: deadlineDate,
      implementationPeriodDays: dto.implementationPeriodDays,
      currentStep: CampaignStep.CONTENT,
    });

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  async saveContentRequirements(
    campaignId: string,
    advertiserId: string,
    dto: SaveContentRequirementsDto,
    file?: Express.Multer.File,
  ): Promise<Campaign> {
    const campaign = await this.findDraftOrFail(campaignId, advertiserId);

    let contentPdfUrl: string | undefined;
    let contentPdfPublicId: string | undefined;

    if (file) {
      if (campaign.contentPdfPublicId) {
        await this.cloudinaryService.deleteFile(campaign.contentPdfPublicId);
      }

      const uploadResult = await this.cloudinaryService.uploadFile(file, 'campaign_pdfs');
      contentPdfUrl = uploadResult.secure_url;
      contentPdfPublicId = uploadResult.public_id;
    }

    const updateData: Partial<Campaign> = {
      contentTypes: dto.contentTypes,
      contentDescription: dto.contentDescription,
      currentStep: CampaignStep.INFLUENCERS,
    };

    if (contentPdfUrl && contentPdfPublicId) {
      updateData.contentPdfUrl = contentPdfUrl;
      updateData.contentPdfPublicId = contentPdfPublicId;
    }

    await this.campaignRepository.update(campaign.id, updateData);

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  async saveInfluencerRequirements(
    campaignId: string,
    advertiserId: string,
    dto: SaveInfluencerRequirementsDto,
  ): Promise<Campaign> {
    const campaign = await this.findDraftOrFail(campaignId, advertiserId);

    if (dto.campaignVisibility === CampaignVisibility.PRIVATE) {
      if (!dto.invitedInfluencerIds || dto.invitedInfluencerIds.length === 0) {
        throw new BadRequestException('يجب اختيار مؤثرين للحملة الخاصة');
      }

      for (const influencerId of dto.invitedInfluencerIds) {
        const influencer = await this.usersService.findById(influencerId);
        if (!influencer || influencer.role !== Role.INFLUENCER) {
          throw new BadRequestException(`المؤثر غير موجود: ${influencerId}`);
        }
      }

      await this.invitedInfluencerRepository.delete({ campaignId: campaign.id });

      const invitations = dto.invitedInfluencerIds.map((influencerId) =>
        this.invitedInfluencerRepository.create({
          campaignId: campaign.id,
          influencerId,
        }),
      );
      await this.invitedInfluencerRepository.save(invitations);
    } else {
      await this.invitedInfluencerRepository.delete({ campaignId: campaign.id });
    }

    await this.campaignRepository.update(campaign.id, {
      requiredInfluencersCount: dto.requiredInfluencersCount,
      influencerType: dto.influencerType,
      campaignVisibility: dto.campaignVisibility,
      currentStep: CampaignStep.BUDGET,
    });

    return this.campaignRepository.findOne({
      where: { id: campaign.id },
      relations: ['invitedInfluencers'],
    });
  }

  async saveBudget(
    campaignId: string,
    advertiserId: string,
    dto: SaveCampaignBudgetDto,
  ): Promise<Campaign> {
    const campaign = await this.findDraftOrFail(campaignId, advertiserId);

    await this.campaignRepository.update(campaign.id, {
      budget: dto.budget,
      currentStep: CampaignStep.REVIEW,
    });

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  async getDraft(campaignId: string, advertiserId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
      relations: ['category', 'invitedInfluencers', 'invitedInfluencers.influencer'],
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    return campaign;
  }

  async getMyDrafts(advertiserId: string): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { advertiserId, status: CampaignStatus.DRAFT },
      relations: ['category'],
      order: { updatedAt: 'DESC' },
    });
  }

  private async findDraftOrFail(campaignId: string, advertiserId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId, status: CampaignStatus.DRAFT },
    });

    if (!campaign) {
      throw new NotFoundException('المسودة غير موجودة');
    }

    return campaign;
  }
}
