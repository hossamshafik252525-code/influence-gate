import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsNotEmpty({ message: 'العنوان مطلوب' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @IsNotEmpty({ message: 'الوصف مطلوب' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsUrl({}, { message: 'رابط المرفق غير صالح' })
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  attachmentPublicId?: string;
}
