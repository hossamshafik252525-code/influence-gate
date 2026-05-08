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
import { SocialLinkingService } from '../../../social-linking/social-linking.service';
import { CampaignApplication } from '../../../campaign/entities/campaign-application.entity';
import { ApplicationStatus } from '../../../campaign/enums/application-status.enum';
import { CampaignStatus } from '../../../campaign/enums/campaign-status.enum';
import { UsersService } from '../../../users/users.service';
import { CountriesService } from '../../../countries/countries.service';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { InfluencerProfileData, InfluencerNumbers } from '../../interfaces';
import { UpdateInfluencerProfileDto, ChangePasswordDto } from '../dto';

@Injectable()
export class InfluencerProfileService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
    @InjectRepository(CampaignApplication)
    private readonly campaignApplicationRepo: Repository<CampaignApplication>,
    private readonly socialLinkingService: SocialLinkingService,
    private readonly usersService: UsersService,
    private readonly countriesService: CountriesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async ensureProfileExists(userId: string): Promise<InfluencerProfile> {
    const existing = await this.influencerProfileRepo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    const profile = this.influencerProfileRepo.create({ userId });
    return this.influencerProfileRepo.save(profile);
  }

  async getProfile(userId: string): Promise<InfluencerProfileData> {
    const profile = await this.influencerProfileRepo.findOne({
      where: { userId },
      relations: ['user', 'user.country', 'categories', 'categories.category'],
    });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.user.fullName,
      userName: profile.userName ?? null,
      email: profile.user.email,
      phone: profile.user.phone ?? null,
      countryId: profile.user.countryId ?? null,
      countryName: profile.user.country?.name ?? null,
      profileImageUrl: profile.profileImageUrl ?? null,
      portfolioLink: profile.portfolioLink ?? null,
      categories: profile.categories
        ?.map((ic) => ic.category)
        ?.filter(Boolean)
        ?.map((c) => ({ id: c.id, name: c.name })) ?? [],
      joiningDate: profile.user.createdAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async getNumbers(userId: string): Promise<InfluencerNumbers> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    const totalFollowers = await this.calculateTotalFollowers(userId);
    const completedCampaignsCount = await this.countCompletedCampaigns(userId);

    return {
      totalFollowers,
      completedCampaignsCount,
      rating: Number(profile.rating),
      ratingCount: profile.ratingCount,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateInfluencerProfileDto,
  ): Promise<InfluencerProfileData> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    if (dto.countryId) {
      await this.countriesService.findOne(dto.countryId);
    }

    const userUpdate: Record<string, unknown> = {};
    if (dto.fullName !== undefined) {
      userUpdate.fullName = dto.fullName;
    }
    if (dto.countryId !== undefined) {
      userUpdate.countryId = dto.countryId;
    }
    if (Object.keys(userUpdate).length > 0) {
      await this.usersService.update(userId, userUpdate);
    }

    const profileUpdate: Partial<InfluencerProfile> = {};
    if (dto.userName !== undefined) {
      profileUpdate.userName = dto.userName;
    }
    if (dto.portfolioLink !== undefined) {
      profileUpdate.portfolioLink = dto.portfolioLink;
    }
    if (dto.profileImageUrl && dto.profileImagePublicId) {
      if (profile.profileImagePublicId) {
        await this.cloudinaryService.deleteImage(profile.profileImagePublicId);
      }
      profileUpdate.profileImageUrl = dto.profileImageUrl;
      profileUpdate.profileImagePublicId = dto.profileImagePublicId;
    }
    if (Object.keys(profileUpdate).length > 0) {
      await this.influencerProfileRepo.update(profile.id, profileUpdate);
    }

    return this.getProfile(userId);
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

  async deleteProfileImage(userId: string): Promise<{ message: string }> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    if (profile.profileImagePublicId) {
      await this.cloudinaryService.deleteImage(profile.profileImagePublicId);
    }

    await this.influencerProfileRepo.update(profile.id, {
      profileImageUrl: null,
      profileImagePublicId: null,
    });

    return { message: 'تم حذف الصورة بنجاح' };
  }

  private async calculateTotalFollowers(userId: string): Promise<number> {
    const { platforms } = await this.socialLinkingService.getLinkedPlatforms(userId);

    if (!platforms || platforms.length === 0) {
      return 0;
    }

    return platforms.reduce((total, platform) => {
      const stats = platform.statistics;
      if (!stats) {
        return total;
      }
      const followers = stats.followersCount ?? stats.followerCount ?? stats.fanCount ?? 0;
      return total + Number(followers);
    }, 0);
  }

  private async countCompletedCampaigns(userId: string): Promise<number> {
    return this.campaignApplicationRepo
      .createQueryBuilder('app')
      .innerJoin('app.campaign', 'campaign')
      .where('app.influencerId = :userId', { userId })
      .andWhere('app.status = :appStatus', { appStatus: ApplicationStatus.ACCEPTED })
      .andWhere('campaign.status = :campaignStatus', { campaignStatus: CampaignStatus.COMPLETED })
      .getCount();
  }
}
