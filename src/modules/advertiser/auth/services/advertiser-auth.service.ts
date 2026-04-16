import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../users/users.service';
import { RedisService } from '../../../redis/redis.service';
import { MailService } from '../../../mail/mail.service';
import { TokenService } from '../../../../common/auth';
import { Role, UserStatus } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { AdvertiserProfile } from '../../entities/advertiser-profile.entity';
import { AdvertiserSignupCache } from '../../interfaces/advertiser-signup-cache.interface';
import {
  AdvertiserSignupDto,
  AdvertiserLoginDto,
  AdvertiserVerifyOtpDto,
  AdvertiserResetPasswordDto,
  AdvertiserVerifyResetCodeDto,
} from '../dto';

@Injectable()
export class AdvertiserAuthService {
  private readonly OTP_TTL = 600;
  private readonly RESET_VERIFIED_TTL = 900;
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    @InjectRepository(AdvertiserProfile)
    private readonly advertiserProfileRepository: Repository<AdvertiserProfile>,
  ) {}

  async signup(dto: AdvertiserSignupDto): Promise<{ message: string }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني مسجل مسبقاً');
    }

    const existingPhone = await this.usersService.findByPhone(dto.phone);
    if (existingPhone) {
      throw new ConflictException('رقم الهاتف مسجل مسبقاً');
    }

    const existingUsername = await this.advertiserProfileRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('اسم المستخدم مسجل مسبقاً');
    }

    const pendingUser = await this.redisService.get(`advertiser-signup:${dto.email}`);
    if (pendingUser) {
      throw new ConflictException('تم إرسال رمز التحقق مسبقاً، يرجى التحقق من بريدك الإلكتروني');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const otp = this.generateOtp();

    await this.redisService.set(
      `advertiser-signup:${dto.email}`,
      {
        fullName: dto.fullName,
        email: dto.email,
        username: dto.username,
        phone: dto.phone,
        password: hashedPassword,
        otp,
      } as AdvertiserSignupCache,
      this.OTP_TTL,
    );

    await this.mailService.sendOtp(dto.email, otp);

    return { message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' };
  }

  async verifyOtp(dto: AdvertiserVerifyOtpDto) {
    const data = await this.redisService.get<AdvertiserSignupCache>(
      `advertiser-signup:${dto.email}`,
    );

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
      password: data.password,
      role: Role.ADVERTISER,
      status: UserStatus.NOT_CONFIRMED,
    });

    const profile = this.advertiserProfileRepository.create({
      userId: user.id,
      username: data.username,
    });
    await this.advertiserProfileRepository.save(profile);

    await this.redisService.del(`advertiser-signup:${dto.email}`);

    const tokens = this.tokenService.generateTokens(user.id);

    return {
      message: 'تم التحقق من البريد الإلكتروني بنجاح',
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    const data = await this.redisService.get<AdvertiserSignupCache>(
      `advertiser-signup:${email}`,
    );

    if (!data) {
      throw new BadRequestException('لا يوجد طلب تسجيل لهذا البريد الإلكتروني');
    }

    const cooldown = await this.redisService.get(`resend-cooldown:${email}`);
    if (cooldown) {
      throw new BadRequestException('يرجى الانتظار 60 ثانية قبل إعادة الإرسال');
    }

    const otp = this.generateOtp();
    data.otp = otp;

    await this.redisService.set(`advertiser-signup:${email}`, data, this.OTP_TTL);
    await this.redisService.set(`resend-cooldown:${email}`, '1', 60);
    await this.mailService.sendOtp(email, otp);

    return { message: 'تم إعادة إرسال رمز التحقق' };
  }

  async login(dto: AdvertiserLoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || user.role !== Role.ADVERTISER) {
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user || user.role !== Role.ADVERTISER) {
      throw new BadRequestException('البريد الإلكتروني غير مسجل');
    }

    const cooldown = await this.redisService.get(`advertiser-forgot-cooldown:${email}`);
    if (cooldown) {
      throw new BadRequestException('يرجى الانتظار 60 ثانية قبل إعادة الإرسال');
    }

    const otp = this.generateOtp();

    await this.redisService.set(`advertiser-reset:${email}`, { otp }, this.OTP_TTL);
    await this.redisService.set(`advertiser-forgot-cooldown:${email}`, '1', 60);
    await this.mailService.sendOtp(email, otp);

    return { message: 'تم إرسال رمز إعادة تعيين كلمة المرور' };
  }

  async verifyResetCode(dto: AdvertiserVerifyResetCodeDto): Promise<{ message: string }> {
    const data = await this.redisService.get<{ otp: string }>(`advertiser-reset:${dto.email}`);

    if (!data) {
      throw new BadRequestException('رمز التحقق منتهي الصلاحية أو غير موجود');
    }

    if (data.otp !== dto.otp) {
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    await this.redisService.del(`advertiser-reset:${dto.email}`);
    await this.redisService.set(`advertiser-reset-verified:${dto.email}`, { verified: true }, this.RESET_VERIFIED_TTL);

    return { message: 'تم التحقق من الرمز بنجاح' };
  }

  async resetPassword(dto: AdvertiserResetPasswordDto): Promise<{ message: string }> {
    const verified = await this.redisService.get<{ verified: boolean }>(`advertiser-reset-verified:${dto.email}`);

    if (!verified) {
      throw new BadRequestException('انتهت صلاحية جلسة إعادة التعيين أو لم يتم التحقق من الرمز');
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (!user || user.role !== Role.ADVERTISER) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    await this.usersService.update(user.id, { password: hashedPassword });
    await this.redisService.del(`advertiser-reset-verified:${dto.email}`);

    return { message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
