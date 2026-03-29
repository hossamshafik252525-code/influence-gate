import { IsEnum, IsString, MinLength, MaxLength, IsNumber, Min, IsInt, Max, IsArray, ArrayMinSize, IsOptional } from 'class-validator';
import { ImplementationType, ContentTypeOffer, TargetPlatform } from '../../../../common/enums';

export class UpdateInfluencerServiceDto {
  @IsOptional()
  @IsEnum(ImplementationType, { message: 'نوع التنفيذ غير صالح' })
  implementationType?: ImplementationType;

  @IsOptional()
  @IsEnum(ContentTypeOffer, { message: 'نوع المحتوى غير صالح' })
  contentType?: ContentTypeOffer;

  @IsOptional()
  @IsString({ message: 'الوصف يجب أن يكون نصاً' })
  @MinLength(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل' })
  @MaxLength(1000, { message: 'الوصف يجب ألا يتجاوز 1000 حرف' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'السعر يجب أن يكون رقماً' })
  @Min(0, { message: 'السعر يجب أن يكون 0 أو أكثر' })
  price?: number;

  @IsOptional()
  @IsInt({ message: 'مدة التنفيذ يجب أن تكون رقماً صحيحاً' })
  @Min(1, { message: 'مدة التنفيذ يجب أن تكون يوماً واحداً على الأقل' })
  @Max(365, { message: 'مدة التنفيذ يجب ألا تتجاوز 365 يوماً' })
  implementationPeriodDays?: number;

  @IsOptional()
  @IsArray({ message: 'المنصات يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار منصة واحدة على الأقل' })
  @IsEnum(TargetPlatform, { each: true, message: 'منصة غير صالحة' })
  includedPlatforms?: TargetPlatform[];
}
