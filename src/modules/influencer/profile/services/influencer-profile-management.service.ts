import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { UsersService } from '../../../users/users.service';
import { CountriesService } from '../../../countries/countries.service';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { CategoriesService } from '../../../categories/categories.service';
import { UpdateInfluencerProfileDto, ChangePasswordDto } from '../dto';

@Injectable()
export class InfluencerProfileManagementService {
  private readonly SALT_ROUNDS = 10;

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
      await this.categoriesService.selectCategories(userId, dto.categoryIds);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.password) {
      throw new BadRequestException('لا يمكن تغيير كلمة المرور لهذا الحساب');
    }

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);
    await this.usersService.update(userId, { password: hashedPassword, isLoggedIn: false });
  }

  async incrementCompletedCampaigns(userId: string): Promise<void> {
    await this.influencerProfileRepository.increment({ userId }, 'completedCampaignsCount', 1);
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
