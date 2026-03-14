import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../../users/users.service';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { AdvertiserProfile } from '../../entities/advertiser-profile.entity';
import { ConfirmAdvertiserProfileDto } from '../dto';
import { UserStatus } from '../../../../common/enums';

@Injectable()
export class AdvertiserProfileService {
  constructor(
    @InjectRepository(AdvertiserProfile)
    private readonly advertiserProfileRepository: Repository<AdvertiserProfile>,
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async confirmProfile(
    userId: string,
    dto: ConfirmAdvertiserProfileDto,
    file?: Express.Multer.File,
  ): Promise<AdvertiserProfile> {
    const profile = await this.advertiserProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('الملف الشخصي غير موجود');
    }

    let logoUrl: string | undefined;
    let logoPublicId: string | undefined;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file, 'advertiser_logos');
      logoUrl = uploadResult.secure_url;
      logoPublicId = uploadResult.public_id;
    }

    const updateData: Partial<AdvertiserProfile> = {
      companyName: dto.companyName,
      typeOfActivity: dto.typeOfActivity,
      city: dto.city,
      companyWebsite: dto.companyWebsite,
      contentTypes: dto.contentTypes,
      targetPlatforms: dto.targetPlatforms,
      expectedBudget: dto.expectedBudget,
    };

    if (logoUrl && logoPublicId) {
      updateData.logoUrl = logoUrl;
      updateData.logoPublicId = logoPublicId;
    }

    await this.advertiserProfileRepository.update(profile.id, updateData);
    await this.usersService.update(userId, { status: UserStatus.CONFIRMED });

    return this.advertiserProfileRepository.findOne({ where: { userId } });
  }
}
