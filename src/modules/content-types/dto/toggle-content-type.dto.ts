import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleContentTypeDto {
  @IsNotEmpty({ message: 'حالة التفعيل مطلوبة' })
  @IsBoolean()
  isActive: boolean;
}
