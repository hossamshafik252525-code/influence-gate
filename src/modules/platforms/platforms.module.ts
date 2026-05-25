import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Platform } from './entities/platform.entity';
import { PlatformsService } from './platforms.service';
import { PlatformsValidationService } from './platforms-validation.service';
import { PlatformsController } from './platforms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Platform])],
  controllers: [PlatformsController],
  providers: [PlatformsService, PlatformsValidationService],
  exports: [PlatformsService, PlatformsValidationService],
})
export class PlatformsModule {}
