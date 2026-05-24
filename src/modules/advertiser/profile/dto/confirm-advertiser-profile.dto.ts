import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  ArrayMinSize,
} from 'class-validator';
import { ExpectedBudget } from '../../../../common/enums';

export class ConfirmAdvertiserProfileDto {
  @IsNotEmpty({ message: 'اسم الشركة مطلوب' })
  @IsString()
  companyName: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'يجب اختيار فئة واحدة على الأقل' })
  @IsUUID('all', { each: true })
  categoryIds: string[];

  @IsNotEmpty({ message: 'الدولة مطلوبة' })
  @IsUUID()
  countryId: string;

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
