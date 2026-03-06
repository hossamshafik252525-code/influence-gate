import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import {
  SignupDto,
  LoginDto,
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  SelectCategoryDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@AuthUser() user: User, @Body() _dto: RefreshTokenDto) {
    return this.authService.refreshTokens(user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('select-category')
  selectCategory(@AuthUser() user: User, @Body() dto: SelectCategoryDto) {
    return this.authService.selectCategory(user.id, dto.category);
  }

  @UseGuards(JwtAuthGuard)
  @Post('connect-social')
  connectSocial() {
    return this.authService.connectSocial();
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-for-review')
  sendForReview(@AuthUser() user: User) {
    return this.authService.sendForReview(user.id);
  }
}

