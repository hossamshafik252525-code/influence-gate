import { IsOptional, IsString, IsUUID, IsUrl, MaxLength, MinLength, IsArray } from 'class-validator';

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

  @IsOptional()
  @IsUrl({}, { message: 'رابط الصورة غير صالح' })
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  profileImagePublicId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categories?: string[];
}
