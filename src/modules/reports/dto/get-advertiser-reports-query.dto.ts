import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContentTypeOffer, TargetPlatform } from '../../../common/enums';
import { ReportStatus } from '../enums';

export class GetAdvertiserReportsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'رقم الصفحة يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'رقم الصفحة يجب أن يكون 1 على الأقل' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الحد يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'الحد يجب أن يكون 1 على الأقل' })
  limit?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(ReportStatus, { each: true, message: 'حالة التقرير غير صالحة' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: ReportStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(TargetPlatform, { each: true, message: 'المنصة غير صالحة' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  platforms?: TargetPlatform[];

  @IsOptional()
  @IsArray()
  @IsEnum(ContentTypeOffer, { each: true, message: 'نوع المحتوى غير صالح' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  contentTypes?: ContentTypeOffer[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف التصنيف غير صالح' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  categoryIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'المدفوع الفعلي من يجب أن يكون رقماً' })
  @Min(0, { message: 'المدفوع الفعلي من يجب أن يكون 0 على الأقل' })
  actualPaidFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'المدفوع الفعلي إلى يجب أن يكون رقماً' })
  @Min(0, { message: 'المدفوع الفعلي إلى يجب أن يكون 0 على الأقل' })
  actualPaidTo?: number;

  @IsOptional()
  @IsString({ message: 'كلمة البحث يجب أن تكون نصاً' })
  search?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'تاريخ البداية يجب أن يكون بصيغة صحيحة' })
  startDate?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'تاريخ النهاية يجب أن يكون بصيغة صحيحة' })
  endDate?: string;
}
