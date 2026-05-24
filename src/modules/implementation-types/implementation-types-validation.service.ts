import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ImplementationType } from './entities/implementation-type.entity';
import { IImplementationTypeValidationService } from './interfaces';

@Injectable()
export class ImplementationTypesValidationService
  implements IImplementationTypeValidationService
{
  constructor(
    @InjectRepository(ImplementationType)
    private readonly repo: Repository<ImplementationType>,
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
