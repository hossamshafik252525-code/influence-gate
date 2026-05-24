import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleImplementationTypeDto {
  @IsNotEmpty({ message: 'حالة التفعيل مطلوبة' })
  @IsBoolean()
  isActive: boolean;
}
