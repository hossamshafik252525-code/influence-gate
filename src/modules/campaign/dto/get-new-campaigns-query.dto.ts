import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TargetPlatform, ContentTypeOffer, ImplementationType } from '../../../common/enums';
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
  @IsEnum(ContentTypeOffer, { message: 'نوع المحتوى غير صالح' })
  contentType?: ContentTypeOffer;

  @IsOptional()
  @IsEnum(ImplementationType, { message: 'نوع التنفيذ غير صالح' })
  implementationType?: ImplementationType;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'مدة التنفيذ يجب أن تكون رقماً صحيحاً' })
  @Min(1, { message: 'مدة التنفيذ يجب أن تكون 1 على الأقل' })
  implementationPeriodDays?: number;

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
