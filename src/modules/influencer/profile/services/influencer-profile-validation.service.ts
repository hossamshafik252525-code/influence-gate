import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';

@Injectable()
export class InfluencerProfileValidationService {
  constructor(
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepository: Repository<InfluencerProfile>,
  ) {}

  async ensureProfileExists(userId: string): Promise<InfluencerProfile> {
    const existing = await this.influencerProfileRepository.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    const profile = this.influencerProfileRepository.create({ userId });
    return this.influencerProfileRepository.save(profile);
  }

  async assertProfileExists(userId: string): Promise<InfluencerProfile> {
    const profile = await this.influencerProfileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }
    return profile;
  }
}
