import { IsNotEmpty, IsString } from 'class-validator';

export class SelectCategoryDto {
  @IsNotEmpty()
  @IsString()
  category: string;
}
