import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContentType } from './entities/content-type.entity';
import { IContentTypeValidationService } from './interfaces';

@Injectable()
export class ContentTypesValidationService
  implements IContentTypeValidationService
{
  constructor(
    @InjectRepository(ContentType)
    private readonly contentTypesRepo: Repository<ContentType>,
  ) {}

  async allExist(ids: string[]): Promise<boolean> {
    if (!ids.length) return false;
    const uniqueIds = Array.from(new Set(ids));
    const count = await this.contentTypesRepo.count({
      where: { id: In(uniqueIds) },
    });
    return count === uniqueIds.length;
  }

  async allActiveExist(ids: string[]): Promise<boolean> {
    if (!ids.length) return false;
    const uniqueIds = Array.from(new Set(ids));
    const count = await this.contentTypesRepo.count({
      where: { id: In(uniqueIds), isActive: true },
    });
    return count === uniqueIds.length;
  }
}
