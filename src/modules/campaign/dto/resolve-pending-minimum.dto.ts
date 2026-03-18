import { IsEnum } from 'class-validator';
import { PendingMinimumAction } from '../enums';

export class ResolvePendingMinimumDto {
  @IsEnum(PendingMinimumAction, { message: 'الإجراء غير صالح' })
  action: PendingMinimumAction;
}
