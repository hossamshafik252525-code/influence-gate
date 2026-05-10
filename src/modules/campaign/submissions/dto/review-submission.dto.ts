import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { SubmissionStatus } from '../enums/submission-status.enum';

export class ReviewSubmissionDto {
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus.ACCEPTED | SubmissionStatus.MODIFICATION_REQUESTED;

  @IsOptional()
  @IsString()
  modificationDetails?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @IsUrl({}, { each: true })
  modificationFileUrls?: string[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @IsString({ each: true })
  modificationFilePublicIds?: string[];
}
