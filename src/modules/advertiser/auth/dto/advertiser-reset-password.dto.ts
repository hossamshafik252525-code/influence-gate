import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../../../common/auth';

export class AdvertiserResetPasswordDto {
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString()
  otp: string;

  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  password: string;

  @IsNotEmpty({ message: 'تأكيد كلمة المرور مطلوب' })
  @IsString()
  @Match('password', { message: 'كلمة المرور وتأكيد كلمة المرور غير متطابقين' })
  confirmPassword: string;
}
