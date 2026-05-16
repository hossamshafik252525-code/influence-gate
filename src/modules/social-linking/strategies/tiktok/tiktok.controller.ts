import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { TikTokStrategy } from './tiktok.strategy';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { User } from '../../../users/entities/user.entity';
import { TikTokOAuthRedirectQueryDto } from '../../dto/tiktok-oauth-redirect-query.dto';

@Controller('social/tiktok')
export class TikTokController {
  private readonly logger = new Logger(TikTokController.name);

  constructor(private readonly tiktokStrategy: TikTokStrategy) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@AuthUser() user: User): { url: string } {
    return this.tiktokStrategy.getAuthUrl(user.id);
  }


  @Get('callback')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleCallback(
    @Query() query: TikTokOAuthRedirectQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    if (query.error) {
      this.logger.warn(
        JSON.stringify({
          event: 'tiktok_oauth_callback_denied',
          error: query.error,
          errorDescription: query.error_description,
          state: query.state,
        }),
      );
      return res.redirect(
        this.tiktokStrategy.buildErrorDeepLink(
          query.error_description ?? query.error ?? 'تم رفض الإذن',
        ),
      );
    }

    if (!query.code || !query.state) {
      this.logger.warn(
        JSON.stringify({
          event: 'tiktok_oauth_callback_missing_params',
          query,
        }),
      );
      return res.redirect(
        this.tiktokStrategy.buildErrorDeepLink('معاملات OAuth مفقودة'),
      );
    }

    try {
      await this.tiktokStrategy.handleCallback(query.code, query.state);

      this.logger.log(
        JSON.stringify({
          event: 'tiktok_oauth_callback_success',
          userId: query.state,
        }),
      );

      return res.redirect(this.tiktokStrategy.buildSuccessDeepLink());
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'فشل في ربط حساب TikTok';

      this.logger.error(
        JSON.stringify({
          event: 'tiktok_oauth_callback_error',
          userId: query.state,
          error: message,
        }),
      );

      return res.redirect(this.tiktokStrategy.buildErrorDeepLink(message));
    }
  }
}
