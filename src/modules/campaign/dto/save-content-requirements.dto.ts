import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  IsUUID,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class SaveContentRequirementsDto {
  @IsArray({ message: 'أنواع المحتوى يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار نوع محتوى واحد على الأقل' })
  @IsUUID('4', { each: true, message: 'معرف نوع المحتوى غير صالح' })
  contentTypeIds: string[];

  @IsNotEmpty({ message: 'وصف المحتوى مطلوب' })
  @IsString({ message: 'وصف المحتوى يجب أن يكون نصاً' })
  contentDescription: string;

  @IsOptional()
  @IsUrl({}, { message: 'رابط ملف PDF غير صالح' })
  contentPdfUrl?: string;

  @IsOptional()
  @IsString()
  contentPdfPublicId?: string;
}
