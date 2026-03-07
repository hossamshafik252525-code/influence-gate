import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'اسم الفئة مطلوب' })
  @IsString()
  name: string;
}
