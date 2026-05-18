import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { ContentType, ExpectedBudget, TargetPlatform } from '../../../../common/enums';

export class UpdateAdvertiserProfileDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ContentType, { each: true })
  contentTypes?: ContentType[];

  @IsOptional()
  @IsArray()
  @IsEnum(TargetPlatform, { each: true })
  targetPlatforms?: TargetPlatform[];

  @IsOptional()
  @IsEnum(ExpectedBudget)
  expectedBudget?: ExpectedBudget;

  @IsOptional()
  @IsUrl({}, { message: 'رابط الشعار غير صالح' })
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoPublicId?: string;
}
