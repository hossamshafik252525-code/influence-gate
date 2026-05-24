import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvertiserProfile } from '../../entities/advertiser-profile.entity';
import { UsersService } from '../../../users/users.service';
import { CategoriesService } from '../../../categories/categories.service';
import { CountriesService } from '../../../countries/countries.service';
import { ContentTypesService } from '../../../content-types/content-types.service';
import { ContentTypesValidationService } from '../../../content-types/content-types-validation.service';
import {
  ConfirmAdvertiserProfileDto,
  UpdateAdvertiserProfileDto,
} from '../dto';
import { UserStatus } from '../../../../common/enums';

@Injectable()
export class AdvertiserProfileManagementService {
  constructor(
    @InjectRepository(AdvertiserProfile)
    private readonly advertiserProfileRepository: Repository<AdvertiserProfile>,
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
    private readonly countriesService: CountriesService,
    private readonly contentTypesService: ContentTypesService,
    private readonly contentTypesValidationService: ContentTypesValidationService,
  ) {}

  async confirmProfile(
    userId: string,
    dto: ConfirmAdvertiserProfileDto,
  ): Promise<AdvertiserProfile> {
    const profile = await this.advertiserProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('الملف الشخصي غير موجود');
    }

    const categories = await this.categoriesService.findByIds(dto.categoryIds);
    if (categories.length !== dto.categoryIds.length) {
      throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
    }
    await this.countriesService.findOne(dto.countryId);

    let contentTypes: AdvertiserProfile['contentTypes'] = [];
    if (dto.contentTypeIds && dto.contentTypeIds.length > 0) {
      const valid = await this.contentTypesValidationService.allActiveExist(
        dto.contentTypeIds,
      );
      if (!valid) {
        throw new BadRequestException('أحد أنواع المحتوى المحددة غير صالح');
      }
      contentTypes = await this.contentTypesService.findByIds(
        dto.contentTypeIds,
      );
    }

    profile.companyName = dto.companyName;
    profile.categories = categories;
    profile.companyWebsite = dto.companyWebsite ?? null;
    profile.contentTypes = contentTypes;
    profile.targetPlatforms = dto.targetPlatforms ?? null;
    profile.expectedBudget = dto.expectedBudget ?? null;

    if (dto.logoUrl && dto.logoPublicId) {
      profile.logoUrl = dto.logoUrl;
      profile.logoPublicId = dto.logoPublicId;
    }

    await this.advertiserProfileRepository.save(profile);
    await this.usersService.update(userId, {
      status: UserStatus.CONFIRMED,
      countryId: dto.countryId,
    });

    return this.advertiserProfileRepository.findOne({
      where: { userId },
      relations: ['user', 'user.country', 'categories', 'contentTypes'],
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateAdvertiserProfileDto,
  ): Promise<void> {
    const profile = await this.advertiserProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    const userUpdate: Record<string, unknown> = {};
    if (dto.fullName !== undefined) userUpdate.fullName = dto.fullName;
    if (dto.countryId !== undefined) {
      await this.countriesService.findOne(dto.countryId);
      userUpdate.countryId = dto.countryId;
    }
    if (Object.keys(userUpdate).length > 0) {
      await this.usersService.update(userId, userUpdate);
    }

    if (dto.categoryIds !== undefined) {
      const categories = await this.categoriesService.findByIds(dto.categoryIds);
      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
      }
      await this.advertiserProfileRepository.save({ ...profile, categories });
    }

    if (dto.contentTypeIds !== undefined) {
      const valid = await this.contentTypesValidationService.allActiveExist(
        dto.contentTypeIds,
      );
      if (!valid) {
        throw new BadRequestException('أحد أنواع المحتوى المحددة غير صالح');
      }
      const contentTypes = await this.contentTypesService.findByIds(
        dto.contentTypeIds,
      );
      await this.advertiserProfileRepository.save({
        ...profile,
        contentTypes,
      });
    }

    const profileUpdate: Partial<AdvertiserProfile> = {};
    if (dto.username !== undefined) profileUpdate.username = dto.username;
    if (dto.companyName !== undefined)
      profileUpdate.companyName = dto.companyName;
    if (dto.companyWebsite !== undefined)
      profileUpdate.companyWebsite = dto.companyWebsite;
    if (dto.targetPlatforms !== undefined)
      profileUpdate.targetPlatforms = dto.targetPlatforms;
    if (dto.expectedBudget !== undefined)
      profileUpdate.expectedBudget = dto.expectedBudget;
    if (dto.logoUrl !== undefined && dto.logoPublicId !== undefined) {
      profileUpdate.logoUrl = dto.logoUrl;
      profileUpdate.logoPublicId = dto.logoPublicId;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await this.advertiserProfileRepository.update(profile.id, profileUpdate);
    }
  }
}
