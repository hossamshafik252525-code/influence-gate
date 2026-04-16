import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InfluencerAuthService } from '../services/influencer-auth.service';
import {
  SignupDto,
  LoginDto,
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
  RefreshTokenDto,
  GoogleRegisterDto,
  ConfirmGoogleDto,
} from '../dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../../../common/guards/jwt-refresh.guard';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { User } from '../../../users/entities/user.entity';

@Controller('auth')
export class InfluencerAuthController {
  constructor(private readonly influencerAuthService: InfluencerAuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.influencerAuthService.signup(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.influencerAuthService.verifyOtp(dto);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.influencerAuthService.resendOtp(dto.email);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.influencerAuthService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@AuthUser() user: User, @Body() _dto: RefreshTokenDto) {
    return this.influencerAuthService.refreshTokens(user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.influencerAuthService.forgotPassword(dto.email);
  }

  @Post('verify-reset-code')
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.influencerAuthService.verifyResetCode(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.influencerAuthService.resetPassword(dto);
  }

  @Post('google')
  googleRegister(@Body() dto: GoogleRegisterDto) {
    return this.influencerAuthService.googleRegister(dto.accessToken);
  }

  @Post('confirm-google')
  confirmGoogle(@Body() dto: ConfirmGoogleDto) {
    return this.influencerAuthService.confirmGoogleRegistration(dto);
  }
}
