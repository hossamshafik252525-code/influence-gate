import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../../users/users.service';
import { CategoriesValidationService } from '../../../categories/categories-validation.service';
import { CountriesService } from '../../../countries/countries.service';
import { AdvertiserProfile } from '../../entities/advertiser-profile.entity';
import { ConfirmAdvertiserProfileDto } from '../dto';
import { UserStatus } from '../../../../common/enums';

@Injectable()
export class AdvertiserProfileService {
  constructor(
    @InjectRepository(AdvertiserProfile)
    private readonly advertiserProfileRepository: Repository<AdvertiserProfile>,
    private readonly usersService: UsersService,
    private readonly categoriesValidationService: CategoriesValidationService,
    private readonly countriesService: CountriesService,
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

    const valid = await this.categoriesValidationService.allExist(dto.categoryIds);
    if (!valid) {
      throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
    }
    await this.countriesService.findOne(dto.countryId);

    const updateData: Partial<AdvertiserProfile> = {
      companyName: dto.companyName,
      categoryIds: dto.categoryIds,
      companyWebsite: dto.companyWebsite,
      contentTypes: dto.contentTypes,
      targetPlatforms: dto.targetPlatforms,
      expectedBudget: dto.expectedBudget,
    };

    if (dto.logoUrl && dto.logoPublicId) {
      updateData.logoUrl = dto.logoUrl;
      updateData.logoPublicId = dto.logoPublicId;
    }

    await this.advertiserProfileRepository.update(profile.id, updateData);
    await this.usersService.update(userId, {
      status: UserStatus.CONFIRMED,
      countryId: dto.countryId,
    });

    return this.advertiserProfileRepository.findOne({ where: { userId } });
  }
}
