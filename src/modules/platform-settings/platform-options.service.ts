import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivePlatform } from './entities/active-platform.entity';
import { ActiveContentType } from './entities/active-content-type.entity';
import { Platform } from '../../common/enums/platform.enum';
import { ContentTypeOffer } from '../../common/enums/content-type-offer.enum';

@Injectable()
export class PlatformOptionsService {
  constructor(
    @InjectRepository(ActivePlatform)
    private readonly activePlatformRepo: Repository<ActivePlatform>,
    @InjectRepository(ActiveContentType)
    private readonly activeContentTypeRepo: Repository<ActiveContentType>,
  ) {}

  async getActivePlatforms(): Promise<Platform[]> {
    const records = await this.activePlatformRepo.find({ where: { isActive: true } });
    return records.map((r) => r.name);
  }

  async getActiveContentTypes(): Promise<ContentTypeOffer[]> {
    const records = await this.activeContentTypeRepo.find({ where: { isActive: true } });
    return records.map((r) => r.name);
  }
}
