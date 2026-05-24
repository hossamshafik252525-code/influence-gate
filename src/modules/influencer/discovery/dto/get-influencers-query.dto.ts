import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { InfluencerType } from '../../../../common/enums';

export class GetInfluencersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsUUID('4')
  countryId?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsUUID('4', { each: true, message: 'معرف المنصة غير صالح' })
  platformIds?: string[];

  @IsOptional()
  @IsEnum(InfluencerType)
  type?: InfluencerType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  followersFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  followersTo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceAverageFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceAverageTo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ratingFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ratingTo?: number;
}
