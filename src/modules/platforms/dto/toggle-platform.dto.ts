import { IsBoolean, IsNotEmpty } from 'class-validator';

export class TogglePlatformDto {
  @IsNotEmpty({ message: 'حالة التفعيل مطلوبة' })
  @IsBoolean()
  isActive: boolean;
}
