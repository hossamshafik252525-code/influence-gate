import {
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { InfluencerType, CampaignVisibility } from '../enums';

export class SaveInfluencerRequirementsDto {
  @IsNotEmpty({ message: 'عدد المؤثرين المطلوب مطلوب' })
  @IsInt({ message: 'عدد المؤثرين يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'يجب أن يكون عدد المؤثرين واحداً على الأقل' })
  requiredInfluencersCount: number;

  @IsNotEmpty({ message: 'نوع المؤثرين مطلوب' })
  @IsEnum(InfluencerType, { message: 'نوع المؤثرين غير صالح' })
  influencerType: InfluencerType;

  @IsNotEmpty({ message: 'نوع الحملة مطلوب' })
  @IsEnum(CampaignVisibility, { message: 'نوع الحملة غير صالح' })
  campaignVisibility: CampaignVisibility;

  @IsOptional()
  @IsArray({ message: 'قائمة المؤثرين يجب أن تكون مصفوفة' })
  @IsUUID('4', { each: true, message: 'معرف المؤثر غير صالح' })
  invitedInfluencerIds?: string[];
}
