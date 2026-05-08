import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'اسم الفئة مطلوب' })
  @IsString()
  name: string;

  @IsOptional()
  @IsUrl({}, { message: 'رابط الأيقونة غير صالح' })
  iconUrl?: string;

  @IsOptional()
  @IsString()
  iconPublicId?: string;
}
