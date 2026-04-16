import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdvertiserVerifyResetCodeDto {
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString()
  otp: string;
}
