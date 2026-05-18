import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TargetPlatform, ImplementationType } from '../../../common/enums';
import { CampaignVisibility } from '../enums';

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

  @IsArray({ message: 'المنصات يجب أن تكون قائمة' })
  @ArrayMinSize(1, { message: 'يجب اختيار منصة واحدة على الأقل' })
  @IsEnum(TargetPlatform, { each: true, message: 'منصة غير صالحة' })
  includedPlatforms: TargetPlatform[];

  @IsNotEmpty({ message: 'نوع التنفيذ مطلوب' })
  @IsEnum(ImplementationType, { message: 'نوع التنفيذ غير صالح' })
  implementationType: ImplementationType;

  @IsNotEmpty({ message: 'نوع الحملة مطلوب' })
  @IsEnum(CampaignVisibility, { message: 'نوع الحملة غير صالح' })
  campaignVisibility: CampaignVisibility;

  @ValidateIf((o) => o.campaignVisibility === CampaignVisibility.PUBLIC)
  @IsNotEmpty({ message: 'تاريخ الموعد النهائي مطلوب' })
  @IsDateString({}, { message: 'تاريخ الموعد النهائي غير صالح' })
  deadlineDate?: string;

  @IsNotEmpty({ message: 'مدة التنفيذ مطلوبة' })
  @IsInt({ message: 'مدة التنفيذ يجب أن تكون رقماً صحيحاً' })
  @Min(1, { message: 'مدة التنفيذ يجب أن تكون يوماً واحداً على الأقل' })
  implementationPeriodDays: number;
}
