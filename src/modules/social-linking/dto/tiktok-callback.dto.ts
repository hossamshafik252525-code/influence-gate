import { IsNotEmpty, IsString } from 'class-validator';

export class TikTokCallbackDto {
  @IsNotEmpty({ message: 'رمز التفويض مطلوب' })
  @IsString()
  code: string;
}
