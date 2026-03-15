import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DeviceType } from '../enums';

export class RegisterFcmTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
