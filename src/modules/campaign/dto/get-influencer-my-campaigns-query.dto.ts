import { IsEnum, IsNotEmpty } from 'class-validator';
import { GetNewCampaignsQueryDto } from './get-new-campaigns-query.dto';
import { ResolvedCampaignStatus } from '../enums';

export class GetInfluencerMyCampaignsQueryDto extends GetNewCampaignsQueryDto {
  @IsNotEmpty({ message: 'حالة الحملة مطلوبة' })
  @IsEnum(ResolvedCampaignStatus, { message: 'حالة الحملة غير صالحة' })
  status: ResolvedCampaignStatus;
}
