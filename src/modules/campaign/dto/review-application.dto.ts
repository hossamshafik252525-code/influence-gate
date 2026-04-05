import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../enums/application-status.enum';

export class ReviewApplicationDto {
  @IsEnum(ApplicationStatus, { message: 'حالة الطلب غير صالحة' })
  status: ApplicationStatus.ACCEPTED | ApplicationStatus.REJECTED;
}
