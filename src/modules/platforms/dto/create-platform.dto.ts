import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlatformDto {
  @IsNotEmpty({ message: 'اسم المنصة مطلوب' })
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
