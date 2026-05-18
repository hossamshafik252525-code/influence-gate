import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesValidationService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  async allExist(ids: string[]): Promise<boolean> {
    if (!ids.length) return false;
    const count = await this.categoriesRepo.count({ where: { id: In(ids) } });
    return count === ids.length;
  }
}
