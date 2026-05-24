import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentType } from './entities/content-type.entity';
import { ContentTypesService } from './content-types.service';
import { ContentTypesValidationService } from './content-types-validation.service';
import { ContentTypesController } from './content-types.controller';
import { ContentTypesSeeder } from './seeders/content-types.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([ContentType])],
  controllers: [ContentTypesController],
  providers: [
    ContentTypesService,
    ContentTypesValidationService,
    ContentTypesSeeder,
  ],
  exports: [ContentTypesService, ContentTypesValidationService],
})
export class ContentTypesModule {}
