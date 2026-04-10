import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignInvitationService } from '../entities/campaign-invitation-service.entity';
import { InfluencerService as InfluencerServiceEntity } from '../../influencer/entities/influencer-service.entity';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import {
  CampaignStatus,
  CampaignStep,
  CampaignVisibility,
  InvitationStatus,
} from '../enums';
import {
  SaveCampaignInformationDto,
  SaveContentRequirementsDto,
  SaveInfluencerRequirementsDto,
  SaveCampaignBudgetDto,
  InvitedInfluencerWithServicesDto,
} from '../dto';
import { CategoriesService } from '../../categories/categories.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { UsersService } from '../../users/users.service';
import { PlatformSettingsService } from '../../platform-settings/platform-settings.service';
import { Role } from '../../../common/enums';

@Injectable()
export class CampaignCreationService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitedInfluencerRepository: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(CampaignInvitationService)
    private readonly invitationServiceRepository: Repository<CampaignInvitationService>,
    @InjectRepository(InfluencerServiceEntity)
    private readonly influencerServiceRepository: Repository<InfluencerServiceEntity>,
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

    await this.clearInvitations(campaign.id);
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

    await this.clearInvitations(campaign.id);

    let nextStep = CampaignStep.BUDGET;

    if (dto.campaignVisibility === CampaignVisibility.PRIVATE) {
      if (!dto.invitedInfluencers || dto.invitedInfluencers.length === 0) {
        throw new BadRequestException('يجب اختيار مؤثرين للحملة الخاصة');
      }

      if (dto.invitedInfluencers.length < dto.requiredInfluencersCount) {
        throw new BadRequestException(
          'عدد المؤثرين المختارين يجب أن يكون أكبر من أو يساوي العدد المطلوب',
        );
      }

      await this.persistPrivateInvitations(campaign.id, dto.invitedInfluencers);

      nextStep = CampaignStep.REVIEW;
    }

    const updateData: Partial<Campaign> = {
      requiredInfluencersCount: dto.requiredInfluencersCount,
      influencerType: dto.influencerType,
      campaignVisibility: dto.campaignVisibility,
      currentStep: nextStep,
    };

    if (dto.campaignVisibility === CampaignVisibility.PRIVATE) {
      updateData.budget = null;
      updateData.influencerPrice = null;
    }

    await this.campaignRepository.update(campaign.id, updateData);

    return this.campaignRepository.findOne({
      where: { id: campaign.id },
      relations: ['invitedInfluencers', 'invitedInfluencers.orderedServices'],
    });
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
        'invitedInfluencers.orderedServices',
        'invitedInfluencers.orderedServices.service',
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

      const services = await this.influencerServiceRepository.find({
        where: { id: In(item.serviceIds), influencerProfileId: profile.id },
      });

      if (services.length !== item.serviceIds.length) {
        throw new BadRequestException(
          `إحدى الخدمات المختارة غير متاحة للمؤثر: ${item.influencerId}`,
        );
      }

      const invitation = this.invitedInfluencerRepository.create({
        campaignId,
        influencerId: item.influencerId,
        status: InvitationStatus.PENDING,
      });
      const savedInvitation = await this.invitedInfluencerRepository.save(invitation);

      const serviceRows = services.map((service) => {
        const basePrice = Number(service.price);
        const priceWithFee = Math.round(basePrice * feeMultiplier * 100) / 100;
        return this.invitationServiceRepository.create({
          invitationId: savedInvitation.id,
          serviceId: service.id,
          basePrice,
          priceWithFee,
        });
      });
      await this.invitationServiceRepository.save(serviceRows);
    }
  }

  private async clearInvitations(campaignId: string): Promise<void> {
    const invitations = await this.invitedInfluencerRepository.find({
      where: { campaignId },
    });
    if (invitations.length === 0) {
      return;
    }
    const invitationIds = invitations.map((i) => i.id);
    await this.invitationServiceRepository.delete({ invitationId: In(invitationIds) });
    await this.invitedInfluencerRepository.delete({ campaignId });
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
