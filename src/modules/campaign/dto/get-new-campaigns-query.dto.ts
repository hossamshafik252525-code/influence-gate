import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsString,
  IsArray,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TargetPlatform } from '../../../common/enums';
import { PaginationQueryDto } from '../../../common/dto';

export class GetNewCampaignsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'كلمة البحث يجب أن تكون نصاً' })
  search?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف التصنيف غير صالح' })
  categoryId?: string;

  @IsOptional()
  @IsEnum(TargetPlatform, { message: 'المنصة غير صالحة' })
  platform?: TargetPlatform;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف نوع المحتوى غير صالح' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  contentTypeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف نوع التنفيذ غير صالح' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  implementationTypeIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'السعر من يجب أن يكون رقماً' })
  @Min(0, { message: 'السعر من يجب أن يكون 0 على الأقل' })
  priceFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'السعر إلى يجب أن يكون رقماً' })
  @Min(0, { message: 'السعر إلى يجب أن يكون 0 على الأقل' })
  priceTo?: number;
}
