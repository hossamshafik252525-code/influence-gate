import { IsNotEmpty, IsString } from 'class-validator';

export class MetaCallbackDto {
  @IsNotEmpty({ message: 'رمز التفويض مطلوب' })
  @IsString()
  code: string;
}
