import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentType } from '../entities/content-type.entity';

const CANONICAL_CONTENT_TYPES: readonly string[] = [
  'story',
  'reel',
  'post',
  'youtube_video',
  'video',
  'live',
  'product_review',
];

@Injectable()
export class ContentTypesSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ContentType)
    private readonly contentTypesRepo: Repository<ContentType>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    for (const name of CANONICAL_CONTENT_TYPES) {
      const existing = await this.contentTypesRepo.findOne({ where: { name } });
      if (!existing) {
        const entity = this.contentTypesRepo.create({ name, isActive: true });
        await this.contentTypesRepo.save(entity);
      }
    }
  }
}
