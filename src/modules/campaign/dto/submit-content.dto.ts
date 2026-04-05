import { IsArray, ArrayMinSize, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubmitContentDto {
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  links: string[];
}
