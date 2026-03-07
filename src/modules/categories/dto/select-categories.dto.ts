import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class SelectCategoriesDto {
  @IsArray({ message: 'يجب تقديم الفئات كمصفوفة' })
  @IsNotEmpty({ message: 'حقل الفئات مطلوب' })
  @IsUUID('4', { each: true, message: 'معرف الفئة غير صالح' })
  categoryIds: string[];
}
