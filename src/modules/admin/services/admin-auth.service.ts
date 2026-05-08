import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { TokenService } from '../../../common/auth';
import { Role } from '../../../common/enums';
import { AdminLoginDto } from '../dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async login(dto: AdminLoginDto): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password'> }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || user.role !== Role.ADMIN) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    await this.usersService.update(user.id, { isLoggedIn: true });
    const tokens = this.tokenService.generateTokens(user.id);
    const { password, ...sanitizedUser } = user;

    return { ...tokens, user: sanitizedUser };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.update(userId, { isLoggedIn: false });
    return { message: 'تم تسجيل الخروج بنجاح' };
  }
}
