import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImplementationType } from '../entities/implementation-type.entity';

const CANONICAL_IMPLEMENTATION_TYPES: readonly string[] = [
  'field_visit',
  'remote_photography',
];

@Injectable()
export class ImplementationTypesSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ImplementationType)
    private readonly repo: Repository<ImplementationType>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    for (const name of CANONICAL_IMPLEMENTATION_TYPES) {
      const existing = await this.repo.findOne({ where: { name } });
      if (!existing) {
        const entity = this.repo.create({ name, isActive: true });
        await this.repo.save(entity);
      }
    }
  }
}
