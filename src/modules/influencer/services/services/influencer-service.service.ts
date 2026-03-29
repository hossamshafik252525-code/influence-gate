import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerService } from '../../entities/influencer-service.entity';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { CreateInfluencerServiceDto } from '../dto/create-influencer-service.dto';
import { UpdateInfluencerServiceDto } from '../dto/update-influencer-service.dto';

@Injectable()
export class InfluencerServiceService {
  constructor(
    @InjectRepository(InfluencerService)
    private readonly influencerServiceRepo: Repository<InfluencerService>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
  ) {}

  async create(userId: string, dto: CreateInfluencerServiceDto): Promise<InfluencerService> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    const service = this.influencerServiceRepo.create({
      influencerProfileId: profile.id,
      ...dto,
    });

    return this.influencerServiceRepo.save(service);
  }

  async findAllByUser(userId: string): Promise<InfluencerService[]> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    return this.influencerServiceRepo.find({
      where: { influencerProfileId: profile.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByUser(serviceId: string, userId: string): Promise<InfluencerService> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    const service = await this.influencerServiceRepo.findOne({
      where: { id: serviceId, influencerProfileId: profile.id },
    });

    if (!service) {
      throw new NotFoundException('الخدمة غير موجودة');
    }

    return service;
  }

  async update(
    serviceId: string,
    userId: string,
    dto: UpdateInfluencerServiceDto,
  ): Promise<InfluencerService> {
    const service = await this.findOneByUser(serviceId, userId);
    Object.assign(service, dto);
    return this.influencerServiceRepo.save(service);
  }

  async remove(serviceId: string, userId: string): Promise<void> {
    const service = await this.findOneByUser(serviceId, userId);
    await this.influencerServiceRepo.remove(service);
  }
}
