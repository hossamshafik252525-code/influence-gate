import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateImplementationTypeDto {
  @IsNotEmpty({ message: 'اسم نوع التنفيذ مطلوب' })
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
