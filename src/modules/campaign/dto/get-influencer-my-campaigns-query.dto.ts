import { IsEnum, IsNotEmpty } from 'class-validator';
import { GetNewCampaignsQueryDto } from './get-new-campaigns-query.dto';
import { MyCampaignsStatusFilter } from '../enums';

export class GetInfluencerMyCampaignsQueryDto extends GetNewCampaignsQueryDto {
  @IsNotEmpty({ message: 'حالة الحملة مطلوبة' })
  @IsEnum(MyCampaignsStatusFilter, { message: 'حالة الحملة غير صالحة' })
  status: MyCampaignsStatusFilter;
}
