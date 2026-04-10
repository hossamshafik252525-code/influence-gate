import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationSetting } from '../entities/notification-setting.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationGroup, getNotificationGroup } from '../enums/notification-group.enum';
import { NotificationSettingItemDto } from '../dto/update-notification-settings.dto';

export interface NotificationSettingView {
  group: NotificationGroup;
  enabled: boolean;
}

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectRepository(NotificationSetting)
    private readonly settingRepo: Repository<NotificationSetting>,
  ) {}

  async getSettings(userId: string): Promise<NotificationSettingView[]> {
    const rows = await this.settingRepo.find({ where: { userId } });
    const map = new Map(rows.map((r) => [r.group, r.enabled]));

    return Object.values(NotificationGroup).map((group) => ({
      group,
      enabled: map.get(group) ?? true,
    }));
  }

  async updateSettings(
    userId: string,
    items: NotificationSettingItemDto[],
  ): Promise<NotificationSettingView[]> {
    const existing = await this.settingRepo.find({
      where: { userId, group: In(items.map((i) => i.group)) },
    });
    const byGroup = new Map(existing.map((r) => [r.group, r]));

    const rows = items.map((item) => {
      const current = byGroup.get(item.group);
      if (current) {
        current.enabled = item.enabled;
        return current;
      }
      return this.settingRepo.create({
        userId,
        group: item.group,
        enabled: item.enabled,
      });
    });

    await this.settingRepo.save(rows);
    return this.getSettings(userId);
  }

  async isEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const group = getNotificationGroup(type);
    const row = await this.settingRepo.findOne({ where: { userId, group } });
    return row ? row.enabled : true;
  }

  async filterEnabledRecipients(
    recipientIds: string[],
    type: NotificationType,
  ): Promise<string[]> {
    if (recipientIds.length === 0) {
      return [];
    }
    const group = getNotificationGroup(type);
    const disabled = await this.settingRepo.find({
      where: { userId: In(recipientIds), group, enabled: false },
      select: ['userId'],
    });
    const disabledSet = new Set(disabled.map((r) => r.userId));
    return recipientIds.filter((id) => !disabledSet.has(id));
  }
}
