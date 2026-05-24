import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Platform } from './entities/platform.entity';
import { CreatePlatformDto, UpdatePlatformDto } from './dto';
import { IPlatformService } from './interfaces';

@Injectable()
export class PlatformsService implements IPlatformService {
  constructor(
    @InjectRepository(Platform)
    private readonly repo: Repository<Platform>,
  ) {}

  async create(dto: CreatePlatformDto): Promise<Platform> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('يوجد منصة بهذا الاسم مسبقاً');
    }
    const entity = this.repo.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(entity);
  }

  async findAll(): Promise<Platform[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findAllActive(): Promise<Platform[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      select: ['name', 'id'],
    });
  }

  async findOne(id: string): Promise<Platform> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('المنصة غير موجودة');
    }
    return entity;
  }

  async findByIds(ids: string[]): Promise<Platform[]> {
    if (!ids.length) return [];
    return this.repo.find({ where: { id: In(ids) } });
  }

  async findByName(name: string): Promise<Platform | null> {
    return this.repo.findOne({ where: { name } });
  }

  async update(id: string, dto: UpdatePlatformDto): Promise<Platform> {
    const entity = await this.findOne(id);

    if (dto.name && dto.name !== entity.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException('يوجد منصة بهذا الاسم مسبقاً');
      }
      entity.name = dto.name;
    }

    if (dto.isActive !== undefined) {
      entity.isActive = dto.isActive;
    }

    return this.repo.save(entity);
  }

  async toggleActive(id: string, isActive: boolean): Promise<Platform> {
    const entity = await this.findOne(id);
    entity.isActive = isActive;
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { message: 'تم حذف المنصة بنجاح' };
  }
}
