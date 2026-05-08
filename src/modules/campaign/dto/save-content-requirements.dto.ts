import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ContentTypeOffer } from '../../../common/enums';

export class SaveContentRequirementsDto {
  @IsArray({ message: 'أنواع المحتوى يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار نوع محتوى واحد على الأقل' })
  @IsEnum(ContentTypeOffer, { each: true, message: 'نوع محتوى غير صالح' })
  contentTypes: ContentTypeOffer[];

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
