import { IsString, MinLength, MaxLength } from 'class-validator';
import { Match } from '../../../common/auth/decorators/match.decorator';

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;

  @IsString()
  @Match('newPassword', { message: 'تأكيد كلمة المرور غير مطابق' })
  confirmPassword: string;
}
