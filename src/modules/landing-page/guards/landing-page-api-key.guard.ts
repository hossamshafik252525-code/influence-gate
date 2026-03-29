import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LandingPageApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const providedKey = request.headers['x-api-key'];
    const expectedKey = this.configService.get<string>('landingPage.apiKey');

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('مفتاح API غير صالح');
    }

    return true;
  }
}
