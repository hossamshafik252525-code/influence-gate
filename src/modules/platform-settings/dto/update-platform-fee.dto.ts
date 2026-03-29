import { IsNumber, Min, Max } from 'class-validator';

export class UpdatePlatformFeeDto {
  @IsNumber({}, { message: 'نسبة العمولة يجب أن تكون رقماً' })
  @Min(0, { message: 'نسبة العمولة يجب أن تكون 0 على الأقل' })
  @Max(100, { message: 'نسبة العمولة يجب أن تكون 100 على الأكثر' })
  percentage: number;
}
