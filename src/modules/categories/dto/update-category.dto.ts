import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({}, { message: 'رابط الأيقونة غير صالح' })
  iconUrl?: string;

  @IsOptional()
  @IsString()
  iconPublicId?: string;
}
