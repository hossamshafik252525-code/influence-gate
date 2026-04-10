import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateInfluencerProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  userName?: string;

  @IsOptional()
  @IsUUID('4')
  countryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  portfolioLink?: string;
}
