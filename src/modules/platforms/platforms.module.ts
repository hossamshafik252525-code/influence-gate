import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Platform } from './entities/platform.entity';
import { PlatformsService } from './platforms.service';
import { PlatformsValidationService } from './platforms-validation.service';
import { PlatformsController } from './platforms.controller';
import { PlatformsSeeder } from './seeders/platforms.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([Platform])],
  controllers: [PlatformsController],
  providers: [PlatformsService, PlatformsValidationService, PlatformsSeeder],
  exports: [PlatformsService, PlatformsValidationService],
})
export class PlatformsModule {}
