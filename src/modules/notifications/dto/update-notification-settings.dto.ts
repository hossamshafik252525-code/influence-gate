import { IsArray, IsBoolean, IsEnum, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationGroup } from '../enums/notification-group.enum';

export class NotificationSettingItemDto {
  @IsEnum(NotificationGroup)
  group: NotificationGroup;

  @IsBoolean()
  enabled: boolean;
}

export class UpdateNotificationSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationSettingItemDto)
  settings: NotificationSettingItemDto[];
}
