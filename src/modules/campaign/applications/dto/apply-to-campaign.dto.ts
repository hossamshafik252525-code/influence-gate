import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, Max } from 'class-validator';

export class ApplyToCampaignDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'قيمة العرض غير صالحة' })
  @IsPositive({ message: 'قيمة العرض يجب أن تكون أكبر من صفر' })
  @Max(9999999999.99, { message: 'قيمة العرض كبيرة جداً' })
  offer?: number;
}
