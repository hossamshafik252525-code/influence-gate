import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';
import { ChangePasswordDto } from '../dto';

@Injectable()
export class UserPasswordService {
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly usersService: UsersService) {}

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.password) {
      throw new BadRequestException('لا يمكن تغيير كلمة المرور لهذا الحساب');
    }

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);
    await this.usersService.update(userId, { password: hashedPassword, isLoggedIn: false });
  }
}
