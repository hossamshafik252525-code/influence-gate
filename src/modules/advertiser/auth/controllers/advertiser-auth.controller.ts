import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdvertiserAuthService } from '../services/advertiser-auth.service';
import {
  AdvertiserSignupDto,
  AdvertiserLoginDto,
  AdvertiserVerifyOtpDto,
  AdvertiserResendOtpDto,
  AdvertiserForgotPasswordDto,
  AdvertiserResetPasswordDto,
} from '../dto';
import { JwtRefreshGuard } from '../../../../common/guards/jwt-refresh.guard';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { User } from '../../../users/entities/user.entity';

@Controller('advertiser/auth')
export class AdvertiserAuthController {
  constructor(private readonly advertiserAuthService: AdvertiserAuthService) {}

  @Post('signup')
  signup(@Body() dto: AdvertiserSignupDto) {
    return this.advertiserAuthService.signup(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: AdvertiserVerifyOtpDto) {
    return this.advertiserAuthService.verifyOtp(dto);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: AdvertiserResendOtpDto) {
    return this.advertiserAuthService.resendOtp(dto.email);
  }

  @Post('login')
  login(@Body() dto: AdvertiserLoginDto) {
    return this.advertiserAuthService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@AuthUser() user: User) {
    return this.advertiserAuthService.refreshTokens(user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: AdvertiserForgotPasswordDto) {
    return this.advertiserAuthService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: AdvertiserResetPasswordDto) {
    return this.advertiserAuthService.resetPassword(dto);
  }
}
