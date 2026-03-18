import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../users/users.service';
import { SocialLinkingService } from '../../../social-linking/social-linking.service';
import { RedisService } from '../../../redis/redis.service';
import { MailService } from '../../../mail/mail.service';
import { TokenService } from '../../../../common/auth';
import { CountriesService } from '../../../countries/countries.service';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import {
  SignupDto,
  LoginDto,
  VerifyOtpDto,
  ResetPasswordDto,
  ConfirmGoogleDto,
} from '../dto';
import { Role, UserStatus } from '../../../../common/enums';
import { NotificationType } from '../../../notifications/enums';
import { User } from '../../../users/entities/user.entity';

@Injectable()
export class InfluencerAuthService {
  private readonly OTP_TTL = 600;
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly socialLinkingService: SocialLinkingService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly httpService: HttpService,
    private readonly countriesService: CountriesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async signup(dto: SignupDto): Promise<{ message: string }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني مسجل مسبقاً');
    }

    const existingPhone = await this.usersService.findByPhone(dto.phone);
    if (existingPhone) {
      throw new ConflictException('رقم الهاتف مسجل مسبقاً');
    }

    const pendingUser = await this.redisService.get(`signup:${dto.email}`);
    if (pendingUser) {
      throw new ConflictException('تم إرسال رمز التحقق مسبقاً، يرجى التحقق من بريدك الإلكتروني');
    }

    await this.countriesService.findOne(dto.countryId);

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const otp = this.generateOtp();

    await this.redisService.set(
      `signup:${dto.email}`,
      {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        countryId: dto.countryId,
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
      countryId: string;
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
      countryId: data.countryId,
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
    const data = await this.redisService.get<{
      fullName: string;
      email: string;
      phone: string;
      countryId: string;
      password: string;
      otp: string;
    }>(`signup:${email}`);

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

  async connectSocial() {
    return this.socialLinkingService.getMetaAuthUrl();
  }

  async sendForReview(userId: string) {
    const user = await this.usersService.findById(userId);

    if (user.status !== UserStatus.CONFIRMED) {
      throw new BadRequestException('يجب تأكيد الحساب أولاً');
    }

    const updatedUser = await this.usersService.update(userId, {
      status: UserStatus.PENDING,
    });

    await this.notificationsService.notifyByRole(
      Role.ADMIN,
      'طلب مراجعة جديد',
      'مؤثر جديد يطلب المراجعة',
      NotificationType.NEW_INFLUENCER_REVIEW,
      { influencerId: userId },
    );

    return {
      message: 'تم إرسال طلب المراجعة بنجاح',
      user: this.sanitizeUser(updatedUser),
    };
  }

  async googleRegister(accessToken: string) {
    const googleProfile = await this.fetchGoogleProfile(accessToken);
    const existingUser = await this.usersService.findByGoogleId(googleProfile.id);

    if (existingUser && existingUser.status !== UserStatus.NOT_CONFIRMED) {
      const tokens = this.tokenService.generateTokens(existingUser.id);
      return {
        ...tokens,
        user: this.sanitizeUser(existingUser),
      };
    }

    if (existingUser) {
      return {
        confirmed: false,
        message: 'يرجى إكمال التسجيل',
        user: this.sanitizeUser(existingUser),
      };
    }

    const emailTaken = await this.usersService.findByEmail(googleProfile.email);
    if (emailTaken) {
      throw new ConflictException('البريد الإلكتروني مسجل مسبقاً بطريقة أخرى');
    }

    const user = await this.usersService.create({
      fullName: googleProfile.name,
      email: googleProfile.email,
      googleId: googleProfile.id,
      status: UserStatus.CONFIRMED,
    });

    return {
      confirmed: false,
      message: 'يرجى إكمال التسجيل',
      user: this.sanitizeUser(user),
    };
  }

  async confirmGoogleRegistration(dto: ConfirmGoogleDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    if (!user.googleId) {
      throw new BadRequestException('هذا الحساب غير مسجل عبر جوجل');
    }

    if (user.status !== UserStatus.NOT_CONFIRMED) {
      throw new BadRequestException('تم تأكيد هذا الحساب مسبقاً');
    }

    await this.countriesService.findOne(dto.countryId);

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const updatedUser = await this.usersService.update(user.id, {
      fullName: dto.fullName || user.fullName,
      phone: dto.phone,
      countryId: dto.countryId,
      password: hashedPassword,
      status: UserStatus.CONFIRMED,
    });

    const tokens = this.tokenService.generateTokens(updatedUser.id);

    return {
      message: 'تم تأكيد التسجيل بنجاح',
      ...tokens,
      user: this.sanitizeUser(updatedUser),
    };
  }

  private async fetchGoogleProfile(
    accessToken: string,
  ): Promise<{ id: string; email: string; name: string; picture?: string }> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      return data;
    } catch {
      throw new BadRequestException('رمز الوصول من جوجل غير صالح');
    }
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
