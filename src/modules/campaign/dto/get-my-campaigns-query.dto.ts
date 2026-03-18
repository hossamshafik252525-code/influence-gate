import { IsOptional, IsInt, Min, IsEnum, IsUUID, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignStatus, CampaignContentType } from '../enums';
import { TargetPlatform } from '../../../common/enums';

export class GetMyCampaignsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'رقم الصفحة يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'رقم الصفحة يجب أن يكون 1 على الأقل' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'عدد العناصر يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'عدد العناصر يجب أن يكون 1 على الأقل' })
  limit: number = 10;

  @IsOptional()
  @IsEnum(CampaignStatus, { message: 'حالة الحملة غير صالحة' })
  status?: CampaignStatus;

  @IsOptional()
  @IsEnum(TargetPlatform, { message: 'المنصة غير صالحة' })
  platform?: TargetPlatform;

  @IsOptional()
  @IsEnum(CampaignContentType, { message: 'نوع المحتوى غير صالح' })
  contentType?: CampaignContentType;

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
