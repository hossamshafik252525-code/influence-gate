import { SocialPlatform } from '../entities/social-platform.entity';

export interface SocialProviderStrategy {
  getAuthUrl(): { url: string };

  handleCallback(code: string, userId: string): Promise<SocialPlatform[]>;

  refreshStats(record: SocialPlatform): Promise<Record<string, any>>;

  refreshToken(record: SocialPlatform): Promise<string>;
}
