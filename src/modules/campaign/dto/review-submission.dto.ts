import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubmissionStatus } from '../enums/submission-status.enum';

export class ReviewSubmissionDto {
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus.ACCEPTED | SubmissionStatus.MODIFICATION_REQUESTED;

  @IsOptional()
  @IsString()
  modificationDetails?: string;
}
