import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TargetPlatform } from '../../../common/enums';

export class SaveCampaignInformationDto {
  @IsNotEmpty({ message: 'اسم الحملة مطلوب' })
  @IsString({ message: 'اسم الحملة يجب أن يكون نصاً' })
  @MaxLength(255, { message: 'اسم الحملة يجب ألا يتجاوز 255 حرفاً' })
  name: string;

  @IsNotEmpty({ message: 'وصف الحملة مطلوب' })
  @IsString({ message: 'وصف الحملة يجب أن يكون نصاً' })
  description: string;

  @IsArray({ message: 'التصنيفات يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار تصنيف واحد على الأقل' })
  @ArrayMaxSize(5, { message: 'لا يمكن اختيار أكثر من 5 تصنيفات' })
  @IsUUID('4', { each: true, message: 'معرف التصنيف غير صالح' })
  categoryIds: string[];

  @IsNotEmpty({ message: 'الدولة مطلوبة' })
  @IsUUID('4', { message: 'معرف الدولة غير صالح' })
  countryId: string;

  @IsArray({ message: 'المنصات يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار منصة واحدة على الأقل' })
  @IsEnum(TargetPlatform, { each: true, message: 'منصة غير صالحة' })
  includedPlatforms: TargetPlatform[];

  @IsArray({ message: 'أنواع التنفيذ يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار نوع تنفيذ واحد على الأقل' })
  @IsUUID('4', { each: true, message: 'معرف نوع التنفيذ غير صالح' })
  implementationTypeIds: string[];

  @IsNotEmpty({ message: 'تاريخ بداية الحملة مطلوب' })
  @IsDateString({}, { message: 'تاريخ بداية الحملة غير صالح' })
  startDate: string;

  @IsNotEmpty({ message: 'تاريخ نهاية الحملة مطلوب' })
  @IsDateString({}, { message: 'تاريخ نهاية الحملة غير صالح' })
  endDate: string;

  @IsNotEmpty({ message: 'تاريخ نهاية فترة التقديم مطلوب' })
  @IsDateString({}, { message: 'تاريخ نهاية فترة التقديم غير صالح' })
  applicationDeadlineDate: string;
}
