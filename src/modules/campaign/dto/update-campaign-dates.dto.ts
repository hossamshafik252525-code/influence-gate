import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateCampaignDatesDto {
  @IsNotEmpty({ message: 'تاريخ نهاية الحملة مطلوب' })
  @IsDateString({}, { message: 'تاريخ نهاية الحملة غير صالح' })
  endDate: string;

  @IsNotEmpty({ message: 'تاريخ نهاية فترة التقديم مطلوب' })
  @IsDateString({}, { message: 'تاريخ نهاية فترة التقديم غير صالح' })
  applicationDeadlineDate: string;
}
