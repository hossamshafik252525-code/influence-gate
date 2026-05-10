import { IsArray, ArrayMinSize, IsUrl, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubmitContentDto {
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  links: string[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @IsUrl({}, { each: true })
  fileUrls?: string[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @IsString({ each: true })
  filePublicIds?: string[];
}
