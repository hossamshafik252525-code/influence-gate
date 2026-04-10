import {
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InfluencerType, CampaignVisibility } from '../enums';
import { InvitedInfluencerWithServicesDto } from './invited-influencer-with-services.dto';

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
  @ArrayMinSize(1, { message: 'يجب اختيار مؤثر واحد على الأقل للحملة الخاصة' })
  @ValidateNested({ each: true })
  @Type(() => InvitedInfluencerWithServicesDto)
  invitedInfluencers?: InvitedInfluencerWithServicesDto[];
}
