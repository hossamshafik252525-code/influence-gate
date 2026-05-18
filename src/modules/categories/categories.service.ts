import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category } from './entities/category.entity';
import { InfluencerProfile } from '../influencer/entities/influencer-profile.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoriesRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('يوجد فئة بهذا الاسم مسبقاً');
    }

    const category = this.categoriesRepo.create({
      name: dto.name,
      iconUrl: dto.iconUrl ?? null,
      iconPublicId: dto.iconPublicId ?? null,
    });

    return this.categoriesRepo.save(category);
  }

  async findAll() {
    return this.categoriesRepo.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'iconUrl'],
    });
  }

  async findOne(id: string) {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('الفئة غير موجودة');
    }
    return category;
  }

  async findByIds(ids: string[]) {
    if (!ids.length) return [];
    return this.categoriesRepo.find({ where: { id: In(ids) } });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesRepo.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException('يوجد فئة بهذا الاسم مسبقاً');
      }
      category.name = dto.name;
    }

    if (dto.iconUrl && dto.iconPublicId) {
      if (category.iconPublicId) {
        await this.cloudinaryService.deleteImage(category.iconPublicId);
      }
      category.iconUrl = dto.iconUrl;
      category.iconPublicId = dto.iconPublicId;
    }

    return this.categoriesRepo.save(category);
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    if (category.iconPublicId) {
      await this.cloudinaryService.deleteImage(category.iconPublicId);
    }

    await this.categoriesRepo.remove(category);
    return { message: 'تم حذف الفئة بنجاح' };
  }

  async selectCategories(userId: string, categoryIds: string[]) {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    if (categoryIds.length > 0) {
      const categories = await this.findByIds(categoryIds);
      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('إحدى الفئات المحددة غير موجودة');
      }
      await this.influencerProfileRepo.save({ ...profile, categories });
    } else {
      await this.influencerProfileRepo.save({ ...profile, categories: [] });
    }

    return { message: 'تم اختيار الفئات بنجاح' };
  }
}
