import {
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateInfluencerProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  userName?: string;

  @IsOptional()
  @IsUUID('4')
  countryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  portfolioLink?: string;

  @IsOptional()
  @IsUrl({}, { message: 'رابط الصورة غير صالح' })
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  profileImagePublicId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف نوع التنفيذ غير صالح' })
  implementationTypeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف نوع المحتوى غير صالح' })
  contentTypeIds?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  implementationPeriodDays?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف المنصة غير صالح' })
  platformIds?: string[];

  @IsOptional()
  @IsUrl({}, { message: 'رابط العمل السابق غير صالح' })
  previousWorkLink?: string;
}
