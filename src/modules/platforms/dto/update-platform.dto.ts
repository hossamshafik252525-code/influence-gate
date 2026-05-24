import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePlatformDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
