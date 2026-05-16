import { SocialPlatform } from '../entities/social-platform.entity';

export interface SocialProviderStrategy {
  handleCallback(code: string, userId: string): Promise<SocialPlatform[]>;

  refreshStats(record: SocialPlatform): Promise<Record<string, any>>;

  refreshToken(record: SocialPlatform): Promise<string>;
}
