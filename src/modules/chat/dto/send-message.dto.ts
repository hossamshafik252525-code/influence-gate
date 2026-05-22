import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty({ message: 'محتوى الرسالة مطلوب' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsUrl({}, { message: 'رابط المرفق غير صالح' })
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  attachmentPublicId?: string;
}
