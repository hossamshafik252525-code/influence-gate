import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { TargetPlatform } from '../../../common/enums';
import { ImplementationType } from '../enums';

export class SaveCampaignInformationDto {
  @IsNotEmpty({ message: 'اسم الحملة مطلوب' })
  @IsString({ message: 'اسم الحملة يجب أن يكون نصاً' })
  @MaxLength(255, { message: 'اسم الحملة يجب ألا يتجاوز 255 حرفاً' })
  name: string;

  @IsNotEmpty({ message: 'وصف الحملة مطلوب' })
  @IsString({ message: 'وصف الحملة يجب أن يكون نصاً' })
  description: string;

  @IsNotEmpty({ message: 'التصنيف مطلوب' })
  @IsUUID('4', { message: 'معرف التصنيف غير صالح' })
  categoryId: string;

  @IsArray({ message: 'المنصات يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار منصة واحدة على الأقل' })
  @IsEnum(TargetPlatform, { each: true, message: 'منصة غير صالحة' })
  includedPlatforms: TargetPlatform[];

  @IsNotEmpty({ message: 'نوع التنفيذ مطلوب' })
  @IsEnum(ImplementationType, { message: 'نوع التنفيذ غير صالح' })
  implementationType: ImplementationType;

  @IsNotEmpty({ message: 'تاريخ الموعد النهائي مطلوب' })
  @IsDateString({}, { message: 'تاريخ الموعد النهائي غير صالح' })
  deadlineDate: string;

  @IsNotEmpty({ message: 'مدة التنفيذ مطلوبة' })
  @IsInt({ message: 'مدة التنفيذ يجب أن تكون رقماً صحيحاً' })
  @Min(1, { message: 'مدة التنفيذ يجب أن تكون يوماً واحداً على الأقل' })
  implementationPeriodDays: number;
}
