import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { UsersService } from '../../../users/users.service';
import { CountriesService } from '../../../countries/countries.service';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { CategoriesService } from '../../../categories/categories.service';
import { ContentTypesService } from '../../../content-types/content-types.service';
import { ContentTypesValidationService } from '../../../content-types/content-types-validation.service';
import { ImplementationTypesService } from '../../../implementation-types/implementation-types.service';
import { ImplementationTypesValidationService } from '../../../implementation-types/implementation-types-validation.service';
import { PlatformsService } from '../../../platforms/platforms.service';
import { PlatformsValidationService } from '../../../platforms/platforms-validation.service';
import { UpdateInfluencerProfileDto } from '../dto';

@Injectable()
export class InfluencerProfileManagementService {
  constructor(
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepository: Repository<InfluencerProfile>,
    private readonly usersService: UsersService,
    private readonly countriesService: CountriesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoriesService: CategoriesService,
    private readonly contentTypesService: ContentTypesService,
    private readonly contentTypesValidationService: ContentTypesValidationService,
    private readonly implementationTypesService: ImplementationTypesService,
    private readonly implementationTypesValidationService: ImplementationTypesValidationService,
    private readonly platformsService: PlatformsService,
    private readonly platformsValidationService: PlatformsValidationService,
  ) {}

  async updateProfile(
    userId: string,
    dto: UpdateInfluencerProfileDto,
  ): Promise<void> {
    const profile = await this.influencerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    if (dto.countryId) {
      await this.countriesService.findOne(dto.countryId);
    }

    const userUpdate: Record<string, unknown> = {};
    if (dto.fullName !== undefined) userUpdate.fullName = dto.fullName;
    if (dto.countryId !== undefined) userUpdate.countryId = dto.countryId;
    if (Object.keys(userUpdate).length > 0) {
      await this.usersService.update(userId, userUpdate);
    }

    const profileUpdate: Partial<InfluencerProfile> = {};
    if (dto.userName !== undefined) profileUpdate.userName = dto.userName;
    if (dto.portfolioLink !== undefined)
      profileUpdate.portfolioLink = dto.portfolioLink;
    if (dto.profileImageUrl && dto.profileImagePublicId) {
      if (profile.profileImagePublicId) {
        await this.cloudinaryService.deleteImage(profile.profileImagePublicId);
      }
      profileUpdate.profileImageUrl = dto.profileImageUrl;
      profileUpdate.profileImagePublicId = dto.profileImagePublicId;
    }
    if (dto.description !== undefined)
      profileUpdate.description = dto.description;
    if (dto.price !== undefined) profileUpdate.price = dto.price;
    if (dto.implementationPeriodDays !== undefined)
      profileUpdate.implementationPeriodDays = dto.implementationPeriodDays;
    if (dto.previousWorkLink !== undefined)
      profileUpdate.previousWorkLink = dto.previousWorkLink;

    if (Object.keys(profileUpdate).length > 0) {
      await this.influencerProfileRepository.update(profile.id, profileUpdate);
      Object.assign(profile, profileUpdate);
    }

    if (dto.categoryIds) {
      const categories = await this.categoriesService.findByIds(dto.categoryIds);
      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
      }
      await this.influencerProfileRepository.save({ ...profile, categories });
    }

    if (dto.contentTypeIds) {
      const valid = await this.contentTypesValidationService.allActiveExist(
        dto.contentTypeIds,
      );
      if (!valid) {
        throw new BadRequestException('أحد أنواع المحتوى المحددة غير صالح');
      }
      const contentTypes = await this.contentTypesService.findByIds(
        dto.contentTypeIds,
      );
      await this.influencerProfileRepository.save({ ...profile, contentTypes });
    }

    if (dto.implementationTypeIds) {
      const valid = await this.implementationTypesValidationService.allActiveExist(
        dto.implementationTypeIds,
      );
      if (!valid) {
        throw new BadRequestException('أحد أنواع التنفيذ المحددة غير صالح');
      }
      const implementationTypes =
        await this.implementationTypesService.findByIds(
          dto.implementationTypeIds,
        );
      await this.influencerProfileRepository.save({
        ...profile,
        implementationTypes,
      });
    }

    if (dto.platformIds) {
      const valid = await this.platformsValidationService.allActiveExist(
        dto.platformIds,
      );
      if (!valid) {
        throw new BadRequestException('إحدى المنصات المحددة غير صالحة');
      }
      const platforms = await this.platformsService.findByIds(dto.platformIds);
      await this.influencerProfileRepository.save({ ...profile, platforms });
    }
  }

  async incrementCompletedCampaigns(userId: string): Promise<void> {
    await this.influencerProfileRepository.increment(
      { userId },
      'completedCampaignsCount',
      1,
    );
  }

  async updateTotalFollowers(
    profileId: string,
    totalFollowers: number,
  ): Promise<void> {
    await this.influencerProfileRepository.update(profileId, { totalFollowers });
  }

  async deleteProfileImage(userId: string): Promise<void> {
    const profile = await this.influencerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    if (profile.profileImagePublicId) {
      await this.cloudinaryService.deleteImage(profile.profileImagePublicId);
    }

    await this.influencerProfileRepository.update(profile.id, {
      profileImageUrl: null,
      profileImagePublicId: null,
    });
  }
}
