import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateImplementationTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
