import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvertiserProfile } from '../../entities/advertiser-profile.entity';
import { UsersService } from '../../../users/users.service';
import { CategoriesService } from '../../../categories/categories.service';
import { CountriesService } from '../../../countries/countries.service';
import { ConfirmAdvertiserProfileDto, UpdateAdvertiserProfileDto } from '../dto';
import { UserStatus } from '../../../../common/enums';

@Injectable()
export class AdvertiserProfileManagementService {
  constructor(
    @InjectRepository(AdvertiserProfile)
    private readonly advertiserProfileRepository: Repository<AdvertiserProfile>,
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
    private readonly countriesService: CountriesService,
  ) {}

  async confirmProfile(
    userId: string,
    dto: ConfirmAdvertiserProfileDto,
  ): Promise<AdvertiserProfile> {
    const profile = await this.advertiserProfileRepository.findOne({ where: { userId } });

    if (!profile) {
      throw new BadRequestException('الملف الشخصي غير موجود');
    }

    const categories = await this.categoriesService.findByIds(dto.categoryIds);
    if (categories.length !== dto.categoryIds.length) {
      throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
    }
    await this.countriesService.findOne(dto.countryId);

    profile.companyName = dto.companyName;
    profile.categories = categories;
    profile.companyWebsite = dto.companyWebsite ?? null;
    profile.contentTypes = dto.contentTypes ?? null;
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
      relations: ['categories'],
    });
  }

  async updateProfile(userId: string, dto: UpdateAdvertiserProfileDto): Promise<void> {
    const profile = await this.advertiserProfileRepository.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    if (dto.countryId !== undefined) {
      await this.countriesService.findOne(dto.countryId);
      await this.usersService.update(userId, { countryId: dto.countryId });
    }

    if (dto.categoryIds !== undefined) {
      const categories = await this.categoriesService.findByIds(dto.categoryIds);
      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
      }
      await this.advertiserProfileRepository.save({ ...profile, categories });
    }

    const profileUpdate: Partial<AdvertiserProfile> = {};
    if (dto.companyName !== undefined) profileUpdate.companyName = dto.companyName;
    if (dto.companyWebsite !== undefined) profileUpdate.companyWebsite = dto.companyWebsite;
    if (dto.contentTypes !== undefined) profileUpdate.contentTypes = dto.contentTypes;
    if (dto.targetPlatforms !== undefined) profileUpdate.targetPlatforms = dto.targetPlatforms;
    if (dto.expectedBudget !== undefined) profileUpdate.expectedBudget = dto.expectedBudget;
    if (dto.logoUrl !== undefined && dto.logoPublicId !== undefined) {
      profileUpdate.logoUrl = dto.logoUrl;
      profileUpdate.logoPublicId = dto.logoPublicId;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await this.advertiserProfileRepository.update(profile.id, profileUpdate);
    }
  }
}
