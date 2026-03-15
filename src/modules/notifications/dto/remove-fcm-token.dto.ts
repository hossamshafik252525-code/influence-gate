import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveFcmTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
