import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContentType } from './entities/content-type.entity';
import { CreateContentTypeDto, UpdateContentTypeDto } from './dto';
import { IContentTypeService } from './interfaces';

@Injectable()
export class ContentTypesService implements IContentTypeService {
  constructor(
    @InjectRepository(ContentType)
    private readonly contentTypesRepo: Repository<ContentType>,
  ) {}

  async create(dto: CreateContentTypeDto): Promise<ContentType> {
    const existing = await this.contentTypesRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('يوجد نوع محتوى بهذا الاسم مسبقاً');
    }

    const entity = this.contentTypesRepo.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
    });
    return this.contentTypesRepo.save(entity);
  }

  async findAll(): Promise<ContentType[]> {
    return this.contentTypesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findAllActive(): Promise<ContentType[]> {
    return this.contentTypesRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ContentType> {
    const entity = await this.contentTypesRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('نوع المحتوى غير موجود');
    }
    return entity;
  }

  async findByIds(ids: string[]): Promise<ContentType[]> {
    if (!ids.length) return [];
    return this.contentTypesRepo.find({ where: { id: In(ids) } });
  }

  async update(id: string, dto: UpdateContentTypeDto): Promise<ContentType> {
    const entity = await this.findOne(id);

    if (dto.name && dto.name !== entity.name) {
      const existing = await this.contentTypesRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('يوجد نوع محتوى بهذا الاسم مسبقاً');
      }
      entity.name = dto.name;
    }

    if (dto.isActive !== undefined) {
      entity.isActive = dto.isActive;
    }

    return this.contentTypesRepo.save(entity);
  }

  async toggleActive(id: string, isActive: boolean): Promise<ContentType> {
    const entity = await this.findOne(id);
    entity.isActive = isActive;
    return this.contentTypesRepo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    await this.contentTypesRepo.remove(entity);
    return { message: 'تم حذف نوع المحتوى بنجاح' };
  }
}
