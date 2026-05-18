import {
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { InfluencerType } from '../enums';

export class SaveInfluencerRequirementsDto {
  @IsOptional()
  @IsInt({ message: 'عدد المؤثرين يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'يجب أن يكون عدد المؤثرين واحداً على الأقل' })
  requiredInfluencersCount?: number;

  @IsNotEmpty({ message: 'نوع المؤثرين مطلوب' })
  @IsEnum(InfluencerType, { message: 'نوع المؤثرين غير صالح' })
  influencerType: InfluencerType;

  @IsOptional()
  @IsArray({ message: 'قائمة المؤثرين يجب أن تكون مصفوفة' })
  @ArrayMinSize(1, { message: 'يجب اختيار مؤثر واحد على الأقل للحملة الخاصة' })
  @IsUUID('4', { each: true, message: 'معرف المؤثر غير صالح' })
  invitedInfluencers?: string[];
}
