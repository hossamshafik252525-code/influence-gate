import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { MailService } from '../../mail/mail.service';
import { TokenService } from './token.service';
import { SignupDto, LoginDto, VerifyOtpDto, ResetPasswordDto } from '../dto';
import { UserStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly OTP_TTL = 600;
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني مسجل مسبقاً');
    }

    const pendingUser = await this.redisService.get(`signup:${dto.email}`);
    if (pendingUser) {
      throw new ConflictException('تم إرسال رمز التحقق مسبقاً، يرجى التحقق من بريدك الإلكتروني');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const otp = this.generateOtp();

    await this.redisService.set(
      `signup:${dto.email}`,
      {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        country: dto.country,
        password: hashedPassword,
        otp,
      },
      this.OTP_TTL,
    );

    await this.mailService.sendOtp(dto.email, otp);

    return { message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const data = await this.redisService.get<{
      fullName: string;
      email: string;
      phone: string;
      country: string;
      password: string;
      otp: string;
    }>(`signup:${dto.email}`);

    if (!data) {
      throw new BadRequestException('رمز التحقق منتهي الصلاحية أو غير موجود');
    }

    if (data.otp !== dto.otp) {
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    const user = await this.usersService.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      country: data.country,
      password: data.password,
      status: UserStatus.CONFIRMED,
    });

    await this.redisService.del(`signup:${dto.email}`);

    const tokens = this.tokenService.generateTokens(user.id);

    return {
      message: 'تم التحقق من البريد الإلكتروني بنجاح',
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async resendOtp(email: string) {
    const data = await this.redisService.get<any>(`signup:${email}`);

    if (!data) {
      throw new BadRequestException('لا يوجد طلب تسجيل لهذا البريد الإلكتروني');
    }

    const otp = this.generateOtp();
    data.otp = otp;

    await this.redisService.set(`signup:${email}`, data, this.OTP_TTL);
    await this.mailService.sendOtp(email, otp);

    return { message: 'تم إعادة إرسال رمز التحقق' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    const tokens = this.tokenService.generateTokens(user.id);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshTokens(user: User) {
    const tokens = this.tokenService.generateTokens(user.id);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('البريد الإلكتروني غير مسجل');
    }

    const otp = this.generateOtp();

    await this.redisService.set(`reset:${email}`, { otp }, this.OTP_TTL);
    await this.mailService.sendOtp(email, otp);

    return { message: 'تم إرسال رمز إعادة تعيين كلمة المرور' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const data = await this.redisService.get<{ otp: string }>(`reset:${dto.email}`);

    if (!data) {
      throw new BadRequestException('رمز التحقق منتهي الصلاحية أو غير موجود');
    }

    if (data.otp !== dto.otp) {
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    await this.usersService.update(user.id, { password: hashedPassword });
    await this.redisService.del(`reset:${dto.email}`);

    return { message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  async selectCategory(userId: string, category: string) {
    const user = await this.usersService.update(userId, { category });

    return { user: this.sanitizeUser(user) };
  }

  async connectSocial(userId: string, platform: string, accessToken: string) {
    const updateData: Partial<User> = {};

    if (platform === 'instagram') {
      updateData.instagramData = { accessToken, connectedAt: new Date() };
    } else if (platform === 'facebook') {
      updateData.facebookData = { accessToken, connectedAt: new Date() };
    }

    const user = await this.usersService.update(userId, updateData);

    return { user: this.sanitizeUser(user) };
  }

  async sendForReview(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user.instagramData && !user.facebookData) {
      throw new BadRequestException('يجب ربط حساب واحد على الأقل (انستغرام أو فيسبوك)');
    }

    const updatedUser = await this.usersService.update(userId, {
      status: UserStatus.PENDING,
    });

    return {
      message: 'تم إرسال طلب المراجعة بنجاح',
      user: this.sanitizeUser(updatedUser),
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
