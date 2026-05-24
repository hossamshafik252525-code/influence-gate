import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ImplementationType } from './entities/implementation-type.entity';
import {
  CreateImplementationTypeDto,
  UpdateImplementationTypeDto,
} from './dto';
import { IImplementationTypeService } from './interfaces';

@Injectable()
export class ImplementationTypesService implements IImplementationTypeService {
  constructor(
    @InjectRepository(ImplementationType)
    private readonly repo: Repository<ImplementationType>,
  ) {}

  async create(dto: CreateImplementationTypeDto): Promise<ImplementationType> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('يوجد نوع تنفيذ بهذا الاسم مسبقاً');
    }
    const entity = this.repo.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(entity);
  }

  async findAll(): Promise<ImplementationType[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findAllActive(): Promise<ImplementationType[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      select:['name' , 'id']
    });
  }

  async findOne(id: string): Promise<ImplementationType> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('نوع التنفيذ غير موجود');
    }
    return entity;
  }

  async findByIds(ids: string[]): Promise<ImplementationType[]> {
    if (!ids.length) return [];
    return this.repo.find({ where: { id: In(ids) } });
  }

  async update(
    id: string,
    dto: UpdateImplementationTypeDto,
  ): Promise<ImplementationType> {
    const entity = await this.findOne(id);

    if (dto.name && dto.name !== entity.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException('يوجد نوع تنفيذ بهذا الاسم مسبقاً');
      }
      entity.name = dto.name;
    }

    if (dto.isActive !== undefined) {
      entity.isActive = dto.isActive;
    }

    return this.repo.save(entity);
  }

  async toggleActive(
    id: string,
    isActive: boolean,
  ): Promise<ImplementationType> {
    const entity = await this.findOne(id);
    entity.isActive = isActive;
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { message: 'تم حذف نوع التنفيذ بنجاح' };
  }
}
