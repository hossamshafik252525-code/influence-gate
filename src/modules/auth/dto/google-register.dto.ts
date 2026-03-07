import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleRegisterDto {
  @IsNotEmpty({ message: 'رمز الوصول من جوجل مطلوب' })
  @IsString()
  accessToken: string;
}
