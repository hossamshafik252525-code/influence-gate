import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import { CampaignStatus, CampaignStep, CampaignVisibility } from '../enums';
import { InvitationStatus } from '../invitations/enums';
import { InvitedInfluencerWithServicesDto } from '../invitations/dto';
import {
  SaveCampaignInformationDto,
  SaveContentRequirementsDto,
  SaveInfluencerRequirementsDto,
  SaveCampaignBudgetDto,
} from '../dto';
import { CategoriesService } from '../../categories/categories.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { UsersService } from '../../users/users.service';
import { PlatformSettingsService } from '../../platform-settings/platform-settings.service';
import { Role } from '../../../common/enums';
import { AdvertiserCampaignMapper } from '../mappers/advertiser-campaign.mapper';
import { AdvertiserCampaignResult } from '../interfaces/advertiser-campaign.interface';

@Injectable()
export class CampaignCreationService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitedInfluencerRepository: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepository: Repository<InfluencerProfile>,
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UsersService,
    private readonly platformSettingsService: PlatformSettingsService,
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

    const updateData: Partial<Campaign> = {
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
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
    const campaign = await this.findDraftOrFail(campaignId, advertiserId);

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
  ): Promise<AdvertiserCampaignResult> {
    const campaign = await this.findDraftOrFail(campaignId, advertiserId);

    if (!campaign.campaignVisibility) {
      throw new BadRequestException('يجب إكمال خطوة المعلومات أولاً');
    }

    await this.invitedInfluencerRepository.delete({ campaignId: campaign.id });

    const isPrivate = campaign.campaignVisibility === CampaignVisibility.PRIVATE;

    if (isPrivate) {
      if (!dto.invitedInfluencers || dto.invitedInfluencers.length === 0) {
        throw new BadRequestException('يجب اختيار مؤثرين للحملة الخاصة');
      }

      await this.persistPrivateInvitations(campaign.id, dto.invitedInfluencers);
    } else {
      if (!dto.requiredInfluencersCount || dto.requiredInfluencersCount < 1) {
        throw new BadRequestException('عدد المؤثرين المطلوب مطلوب للحملات العامة');
      }
    }

    const updateData: Partial<Campaign> = {
      influencerType: dto.influencerType,
      currentStep: isPrivate ? CampaignStep.REVIEW : CampaignStep.BUDGET,
    };

    if (isPrivate) {
      updateData.requiredInfluencersCount = dto.invitedInfluencers.length;
      updateData.budget = null;
      updateData.influencerPrice = null;
    } else {
      updateData.requiredInfluencersCount = dto.requiredInfluencersCount;
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

    return AdvertiserCampaignMapper.toResult(updated);
  }

  async saveBudget(
    campaignId: string,
    advertiserId: string,
    dto: SaveCampaignBudgetDto,
  ): Promise<Campaign> {
    const campaign = await this.findDraftOrFail(campaignId, advertiserId);

    if (campaign.campaignVisibility === CampaignVisibility.PRIVATE) {
      throw new BadRequestException('لا يتم تحديد الميزانية للحملات الخاصة');
    }

    const feePercentage = await this.platformSettingsService.getPlatformFeePercentage();
    const influencerPrice =
      (dto.budget * (1 - feePercentage / 100)) / (campaign.requiredInfluencersCount || 1);

    await this.campaignRepository.update(campaign.id, {
      budget: dto.budget,
      influencerPrice: Math.round(influencerPrice * 100) / 100,
      currentStep: CampaignStep.REVIEW,
    });

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  async getDraft(campaignId: string, advertiserId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
      relations: [
        'category',
        'invitedInfluencers',
        'invitedInfluencers.influencer',
        'invitedInfluencers.influencer.influencerProfile',
      ],
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

  private async persistPrivateInvitations(
    campaignId: string,
    invited: InvitedInfluencerWithServicesDto[],
  ): Promise<void> {
    const feePercentage = await this.platformSettingsService.getPlatformFeePercentage();
    const feeMultiplier = 1 + feePercentage / 100;

    for (const item of invited) {
      const influencer = await this.usersService.findById(item.influencerId);
      if (!influencer || influencer.role !== Role.INFLUENCER) {
        throw new BadRequestException(`المؤثر غير موجود: ${item.influencerId}`);
      }

      const profile = await this.influencerProfileRepository.findOne({
        where: { userId: item.influencerId },
      });
      if (!profile) {
        throw new BadRequestException(`الملف الشخصي للمؤثر غير موجود: ${item.influencerId}`);
      }

      if (!profile.price) {
        throw new BadRequestException(`المؤثر لم يحدد سعر الخدمة: ${item.influencerId}`);
      }

      const basePrice = Number(profile.price);
      const priceWithFee = Math.round(basePrice * feeMultiplier * 100) / 100;

      const invitation = this.invitedInfluencerRepository.create({
        campaignId,
        influencerId: item.influencerId,
        status: InvitationStatus.PENDING,
        basePrice,
        priceWithFee,
      });
      await this.invitedInfluencerRepository.save(invitation);
    }
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
