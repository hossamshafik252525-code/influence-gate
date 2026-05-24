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
import { CampaignStatus } from '../enums';
import { PaginationQueryDto } from '../../../common/dto';

export class GetAdvertiserMyCampaignsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(CampaignStatus, { each: true, message: 'حالة الحملة غير صالحة' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: CampaignStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(TargetPlatform, { each: true, message: 'المنصة غير صالحة' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  platforms?: TargetPlatform[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف نوع المحتوى غير صالح' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  contentTypeIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الميزانية من يجب أن تكون رقماً' })
  @Min(0, { message: 'الميزانية من يجب أن تكون 0 على الأقل' })
  budgetFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الميزانية إلى يجب أن تكون رقماً' })
  @Min(0, { message: 'الميزانية إلى يجب أن تكون 0 على الأقل' })
  budgetTo?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف التصنيف غير صالح' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  categoryIds?: string[];

  @IsOptional()
  @IsString({ message: 'كلمة البحث يجب أن تكون نصاً' })
  search?: string;
}
