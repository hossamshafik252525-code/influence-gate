import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImplementationType } from './entities/implementation-type.entity';
import { ImplementationTypesService } from './implementation-types.service';
import { ImplementationTypesValidationService } from './implementation-types-validation.service';
import { ImplementationTypesController } from './implementation-types.controller';
import { ImplementationTypesSeeder } from './seeders/implementation-types.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([ImplementationType])],
  controllers: [ImplementationTypesController],
  providers: [
    ImplementationTypesService,
    ImplementationTypesValidationService,
    ImplementationTypesSeeder,
  ],
  exports: [
    ImplementationTypesService,
    ImplementationTypesValidationService,
  ],
})
export class ImplementationTypesModule {}
