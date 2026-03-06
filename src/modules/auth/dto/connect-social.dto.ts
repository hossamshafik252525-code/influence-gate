import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ConnectSocialDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['instagram', 'facebook'])
  platform: string;

  @IsNotEmpty()
  @IsString()
  accessToken: string;
}
