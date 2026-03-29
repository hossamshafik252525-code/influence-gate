import { IsOptional, IsEnum, IsUUID, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TargetPlatform, ContentTypeOffer } from '../../../common/enums';
import { CampaignStatus } from '../enums';
import { PaginationQueryDto } from '../../../common/dto';

export class GetMyCampaignsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CampaignStatus, { message: 'حالة الحملة غير صالحة' })
  status?: CampaignStatus;

  @IsOptional()
  @IsEnum(TargetPlatform, { message: 'المنصة غير صالحة' })
  platform?: TargetPlatform;

  @IsOptional()
  @IsEnum(ContentTypeOffer, { message: 'نوع المحتوى غير صالح' })
  contentType?: ContentTypeOffer;

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
  @IsUUID('4', { message: 'معرف التصنيف غير صالح' })
  categoryId?: string;

  @IsOptional()
  @IsString({ message: 'كلمة البحث يجب أن تكون نصاً' })
  search?: string;
}
