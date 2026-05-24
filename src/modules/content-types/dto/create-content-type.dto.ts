import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContentTypeDto {
  @IsNotEmpty({ message: 'اسم نوع المحتوى مطلوب' })
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
