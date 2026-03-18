import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { CampaignContentType } from '../enums';

export class SaveContentRequirementsDto {
  @IsArray({ message: 'أنواع المحتوى يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار نوع محتوى واحد على الأقل' })
  @IsEnum(CampaignContentType, { each: true, message: 'نوع محتوى غير صالح' })
  contentTypes: CampaignContentType[];

  @IsNotEmpty({ message: 'وصف المحتوى مطلوب' })
  @IsString({ message: 'وصف المحتوى يجب أن يكون نصاً' })
  contentDescription: string;
}
