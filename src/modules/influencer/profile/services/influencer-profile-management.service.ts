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
  ) {}

  async updateProfile(userId: string, dto: UpdateInfluencerProfileDto): Promise<void> {
    const profile = await this.influencerProfileRepository.findOne({ where: { userId } });
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
    if (dto.portfolioLink !== undefined) profileUpdate.portfolioLink = dto.portfolioLink;
    if (dto.profileImageUrl && dto.profileImagePublicId) {
      if (profile.profileImagePublicId) {
        await this.cloudinaryService.deleteImage(profile.profileImagePublicId);
      }
      profileUpdate.profileImageUrl = dto.profileImageUrl;
      profileUpdate.profileImagePublicId = dto.profileImagePublicId;
    }
    if (dto.implementationType !== undefined) profileUpdate.implementationType = dto.implementationType;
    if (dto.contentType !== undefined) profileUpdate.contentType = dto.contentType;
    if (dto.description !== undefined) profileUpdate.description = dto.description;
    if (dto.price !== undefined) profileUpdate.price = dto.price;
    if (dto.implementationPeriodDays !== undefined) profileUpdate.implementationPeriodDays = dto.implementationPeriodDays;
    if (dto.includedPlatforms !== undefined) profileUpdate.includedPlatforms = dto.includedPlatforms;
    if (dto.previousWorkLink !== undefined) profileUpdate.previousWorkLink = dto.previousWorkLink;

    if (Object.keys(profileUpdate).length > 0) {
      await this.influencerProfileRepository.update(profile.id, profileUpdate);
    }

    if (dto.categoryIds) {
      const categories = await this.categoriesService.findByIds(dto.categoryIds);
      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
      }
      await this.influencerProfileRepository.save({ ...profile, categories });
    }
  }

  async incrementCompletedCampaigns(userId: string): Promise<void> {
    await this.influencerProfileRepository.increment({ userId }, 'completedCampaignsCount', 1);
  }

  async updateTotalFollowers(profileId: string, totalFollowers: number): Promise<void> {
    await this.influencerProfileRepository.update(profileId, { totalFollowers });
  }

  async deleteProfileImage(userId: string): Promise<void> {
    const profile = await this.influencerProfileRepository.findOne({ where: { userId } });
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
