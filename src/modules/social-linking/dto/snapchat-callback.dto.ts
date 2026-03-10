import { IsNotEmpty, IsString } from 'class-validator';

export class SnapchatCallbackDto {
  @IsNotEmpty({ message: 'رمز التفويض مطلوب' })
  @IsString()
  code: string;
}
