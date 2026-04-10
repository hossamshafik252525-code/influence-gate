import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { InfluencerCategory } from '../influencer/entities/influencer-category.entity';
import { InfluencerProfile } from '../influencer/entities/influencer-profile.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(InfluencerCategory)
    private readonly influencerCategoryRepo: Repository<InfluencerCategory>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateCategoryDto, file?: Express.Multer.File) {
    const existing = await this.categoriesRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('يوجد فئة بهذا الاسم مسبقاً');
    }

    let iconUrl = null;
    let iconPublicId = null;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file, 'categories');
      iconUrl = uploadResult.secure_url;
      iconPublicId = uploadResult.public_id;
    }

    const category = this.categoriesRepo.create({
      name: dto.name,
      iconUrl,
      iconPublicId,
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

  async update(id: string, dto: UpdateCategoryDto, file?: Express.Multer.File) {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesRepo.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException('يوجد فئة بهذا الاسم مسبقاً');
      }
      category.name = dto.name;
    }

    if (file) {
      if (category.iconPublicId) {
        await this.cloudinaryService.deleteImage(category.iconPublicId);
      }
      const uploadResult = await this.cloudinaryService.uploadImage(file, 'categories');
      category.iconUrl = uploadResult.secure_url;
      category.iconPublicId = uploadResult.public_id;
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

  async getUserCategories(userId: string): Promise<InfluencerCategory[]> {
    return this.influencerCategoryRepo.find({ where: { influencerProfile: { userId } }, relations: ['category'] });
  }

  async selectCategories(userId: string, categoryIds: string[]) {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    await this.influencerCategoryRepo.delete({ influencerProfile: { id: profile.id } });

    if (categoryIds.length > 0) {
      const influencerCategories = categoryIds.map((categoryId) =>
        this.influencerCategoryRepo.create({
          influencerProfile: { id: profile.id },
          category: { id: categoryId },
        }),
      );
      await this.influencerCategoryRepo.save(influencerCategories);
    }

    return { message: 'تم اختيار الفئات بنجاح' };
  }
}
