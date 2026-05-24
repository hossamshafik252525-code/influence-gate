import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSetting } from './entities/platform-setting.entity';
import { ActivePlatform } from './entities/active-platform.entity';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformOptionsService } from './platform-options.service';
import { PlatformSettingsController } from './platform-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformSetting, ActivePlatform])],
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsService, PlatformOptionsService],
  exports: [PlatformSettingsService, PlatformOptionsService],
})
export class PlatformSettingsModule {}
