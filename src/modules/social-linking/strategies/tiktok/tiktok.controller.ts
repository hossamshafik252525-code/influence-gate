import { Controller, Get, Post, Body, Query, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import type { Response } from 'express';
import { TikTokStrategy } from './tiktok.strategy';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { User } from '../../../users/entities/user.entity';
import { TikTokCallbackDto } from '../../dto/tiktok-callback.dto';
import { TikTokOAuthRedirectQueryDto } from '../../dto/tiktok-oauth-redirect-query.dto';

@Controller('social/tiktok')
export class TikTokController {
  constructor(private readonly tiktokStrategy: TikTokStrategy) {}

  // @Get('callback')
  // oauthRedirect(@Query() query: TikTokOAuthRedirectQueryDto, @Res() res: Response): void {
  //   const html = TikTokController.buildOAuthResultPage(query);
  //   res.type('html').charset('utf-8').send(html);
  // }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(): { url: string } {
    return this.tiktokStrategy.getAuthUrl();
  }

  @Post('link')
  @UseGuards(JwtAuthGuard)
  handleLink(@Body() dto: TikTokCallbackDto, @AuthUser() user: User): Promise<import('../../entities/social-platform.entity').SocialPlatform[]> {
    return this.tiktokStrategy.handleCallback(dto.code, user.id);
  }

  private static buildOAuthResultPage(query: TikTokOAuthRedirectQueryDto): string {
    const hasError = Boolean(query.error);
    const hasCode = Boolean(query.code);
    const title = hasError ? 'TikTok authorization' : hasCode ? 'TikTok connected' : 'TikTok authorization';
    const headline = hasError
      ? 'Authorization could not be completed'
      : hasCode
        ? 'Authorization succeeded'
        : 'Return to the app';
    const detail = hasError
      ? escapeHtml(query.error_description ?? query.error ?? 'Unknown error')
      : hasCode
        ? 'You can close this window and return to the app to finish linking your account.'
        : 'If your app does not update automatically, close this window and try again.';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; color: #111; }
    h1 { font-size: 1.25rem; }
    p { max-width: 36rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(headline)}</h1>
  <p>${detail}</p>
  <script>
    (function () {
      try {
        if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
          window.flutter_inappwebview.callHandler('tiktokOAuthFinished', ${hasError ? '{ ok: false }' : hasCode ? '{ ok: true }' : '{ ok: false }'});
        }
      } catch (e) {}
    })();
  </script>
</body>
</html>`;
  }
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
