import { IsEmail, IsNotEmpty } from 'class-validator';

export class AdvertiserForgotPasswordDto {
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;
}
