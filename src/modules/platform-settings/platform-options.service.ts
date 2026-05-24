import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivePlatform } from './entities/active-platform.entity';
import { Platform } from '../../common/enums/platform.enum';

@Injectable()
export class PlatformOptionsService {
  constructor(
    @InjectRepository(ActivePlatform)
    private readonly activePlatformRepo: Repository<ActivePlatform>,
  ) {}

  async getActivePlatforms(): Promise<Platform[]> {
    const records = await this.activePlatformRepo.find({ where: { isActive: true } });
    return records.map((r) => r.name);
  }
}
