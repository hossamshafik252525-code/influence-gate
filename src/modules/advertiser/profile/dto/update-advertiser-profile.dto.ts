import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ExpectedBudget } from '../../../../common/enums';

export class UpdateAdvertiserProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف نوع المحتوى غير صالح' })
  contentTypeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف المنصة غير صالح' })
  platformIds?: string[];

  @IsOptional()
  @IsEnum(ExpectedBudget)
  expectedBudget?: ExpectedBudget;

  @IsOptional()
  @IsUrl({}, { message: 'رابط الشعار غير صالح' })
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoPublicId?: string;
}
