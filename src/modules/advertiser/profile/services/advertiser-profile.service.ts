import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../../users/users.service';
import { CategoriesService } from '../../../categories/categories.service';
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
    private readonly categoriesService: CategoriesService,
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
}
