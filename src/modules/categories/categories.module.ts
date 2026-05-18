import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesValidationService } from './categories-validation.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { InfluencerCategory } from '../influencer/entities/influencer-category.entity';
import { InfluencerProfile } from '../influencer/entities/influencer-profile.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, InfluencerCategory, InfluencerProfile]), CloudinaryModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesValidationService],
  exports: [CategoriesService, CategoriesValidationService],
})
export class CategoriesModule {}
