import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from './entities/platform-setting.entity';

@Injectable()
export class PlatformSettingsService {
  private readonly FEE_KEY = 'platform_fee_percentage';
  private readonly DEFAULT_FEE = '10';

  constructor(
    @InjectRepository(PlatformSetting)
    private readonly settingRepo: Repository<PlatformSetting>,
  ) {}

  async getPlatformFeePercentage(): Promise<number> {
    const setting = await this.findOrCreateFeeSetting();
    return Number(setting.value);
  }

  async updatePlatformFeePercentage(percentage: number): Promise<PlatformSetting> {
    const setting = await this.findOrCreateFeeSetting();
    setting.value = String(percentage);
    return this.settingRepo.save(setting);
  }

  private async findOrCreateFeeSetting(): Promise<PlatformSetting> {
    const existing = await this.settingRepo.findOne({ where: { key: this.FEE_KEY } });
    if (existing) {
      return existing;
    }

    const setting = this.settingRepo.create({
      key: this.FEE_KEY,
      value: this.DEFAULT_FEE,
    });
    return this.settingRepo.save(setting);
  }
}
