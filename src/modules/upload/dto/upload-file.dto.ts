import { IsEnum } from 'class-validator';
import { UploadType } from '../enums';

export class UploadFileDto {
  @IsEnum(UploadType, { message: 'نوع الرفع غير صالح' })
  type: UploadType;
}
