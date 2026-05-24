import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Platform } from './entities/platform.entity';
import { IPlatformValidationService } from './interfaces';

@Injectable()
export class PlatformsValidationService implements IPlatformValidationService {
  constructor(
    @InjectRepository(Platform)
    private readonly repo: Repository<Platform>,
  ) {}

  async allExist(ids: string[]): Promise<boolean> {
    if (!ids.length) return false;
    const uniqueIds = Array.from(new Set(ids));
    const count = await this.repo.count({ where: { id: In(uniqueIds) } });
    return count === uniqueIds.length;
  }

  async allActiveExist(ids: string[]): Promise<boolean> {
    if (!ids.length) return false;
    const uniqueIds = Array.from(new Set(ids));
    const count = await this.repo.count({
      where: { id: In(uniqueIds), isActive: true },
    });
    return count === uniqueIds.length;
  }
}
