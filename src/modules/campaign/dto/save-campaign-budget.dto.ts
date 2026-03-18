import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class SaveCampaignBudgetDto {
  @IsNotEmpty({ message: 'الميزانية مطلوبة' })
  @IsNumber({}, { message: 'الميزانية يجب أن تكون رقماً' })
  @Min(1, { message: 'الميزانية يجب أن تكون أكبر من صفر' })
  budget: number;
}
