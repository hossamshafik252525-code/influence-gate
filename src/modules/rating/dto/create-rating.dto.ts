import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRatingDto {
  @IsUUID()
  submissionId: string;

  /** Commitment to deadlines — 1 to 5 */
  @IsInt()
  @Min(1)
  @Max(5)
  commitment: number;

  /** Quality of delivered content — 1 to 5 */
  @IsInt()
  @Min(1)
  @Max(5)
  qualityOfWork: number;

  /** Communication & cooperation — 1 to 5 */
  @IsInt()
  @Min(1)
  @Max(5)
  communication: number;

  /** Optional note from the rater */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
