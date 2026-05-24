import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platform } from '../entities/platform.entity';

const CANONICAL_PLATFORMS: readonly string[] = [
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'x',
];

@Injectable()
export class PlatformsSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Platform)
    private readonly repo: Repository<Platform>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    for (const name of CANONICAL_PLATFORMS) {
      const existing = await this.repo.findOne({ where: { name } });
      if (!existing) {
        const entity = this.repo.create({ name, isActive: true });
        await this.repo.save(entity);
      }
    }
  }
}
