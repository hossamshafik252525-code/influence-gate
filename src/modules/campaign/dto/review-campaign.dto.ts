import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CampaignStatus } from '../enums';

export class ReviewCampaignDto {
  @IsEnum(CampaignStatus, { message: 'حالة المراجعة غير صالحة' })
  status: CampaignStatus.APPROVED | CampaignStatus.REJECTED;

  @IsOptional()
  @IsString({ message: 'سبب الرفض يجب أن يكون نصاً' })
  rejectionReason?: string;
}
