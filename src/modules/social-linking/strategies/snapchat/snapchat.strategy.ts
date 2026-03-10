import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { randomBytes } from 'crypto';
import { SocialProviderStrategy } from '../../interfaces/social-provider.interface';
import { SocialPlatform } from '../../entities/social-platform.entity';
import { Platform } from '../../../../common/enums';
import {
  SnapchatTokenResponse,
  SnapchatUserResponse,
  SnapchatPlatformStatistics,
} from './snapchat.types';

@Injectable()
export class SnapchatStrategy implements SocialProviderStrategy {
  private readonly authUrl: string = 'https://accounts.snapchat.com/accounts/oauth2/auth';
  private readonly tokenUrl: string = 'https://accounts.snapchat.com/accounts/oauth2/token';
  private readonly userInfoUrl: string = 'https://kit.snapchat.com/v1/me';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('snapchat.clientId');
    this.clientSecret = this.configService.get<string>('snapchat.clientSecret');
    this.callbackUrl = this.configService.get<string>('snapchat.callbackUrl');
  }

  getAuthUrl(): { url: string } {
    const scopes = [
      'https://auth.snapchat.com/oauth2/api/user.display_name',
      'https://auth.snapchat.com/oauth2/api/user.external_id',
      'https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar',
    ].join(' ');

    const state = randomBytes(32).toString('base64url');

    const url =
      `${this.authUrl}` +
      `?client_id=${this.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.callbackUrl)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code` +
      `&state=${state}`;

    return { url };
  }

  async handleCallback(code: string, userId: string): Promise<SocialPlatform[]> {
    const tokenData = await this.exchangeCodeForTokens(code);
    const tokenExpiresAt = this.calculateTokenExpiry(tokenData.expires_in);

    const profile = await this.fetchUserProfile(tokenData.access_token);
    const meData = profile.data.me;
    const statistics = this.extractStatistics(meData);

    await this.upsertPlatform(
      userId,
      meData.externalId,
      meData.displayName,
      tokenData.access_token,
      tokenData.refresh_token ?? null,
      tokenExpiresAt,
      meData,
      statistics,
    );

    return this.findUserPlatforms(userId);
  }

  async refreshStats(record: SocialPlatform): Promise<Record<string, any>> {
    const profile = await this.fetchUserProfile(record.accessToken);
    return this.extractStatistics(profile.data.me);
  }

  async refreshToken(record: SocialPlatform): Promise<string> {
    if (!this.isTokenNearExpiry(record.tokenExpiresAt)) {
      return record.accessToken;
    }

    const refreshToken = record.pageAccessToken;
    if (!refreshToken) {
      return record.accessToken;
    }

    const newTokenData = await this.exchangeRefreshToken(refreshToken);

    await this.socialPlatformRepo.update(record.id, {
      accessToken: newTokenData.access_token,
      pageAccessToken: newTokenData.refresh_token ?? refreshToken,
      tokenExpiresAt: this.calculateTokenExpiry(newTokenData.expires_in),
    });

    return newTokenData.access_token;
  }

  private buildBasicAuthHeader(): string {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async exchangeCodeForTokens(code: string): Promise<SnapchatTokenResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<SnapchatTokenResponse>(
          this.tokenUrl,
          new URLSearchParams({
            grant_type: 'authorization_code',
            redirect_uri: this.callbackUrl,
            code,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: this.buildBasicAuthHeader(),
            },
          },
        ),
      );
      return data;
    } catch {
      throw new BadRequestException('فشل في تبادل رمز التفويض مع Snapchat');
    }
  }

  private async exchangeRefreshToken(refreshToken: string): Promise<SnapchatTokenResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<SnapchatTokenResponse>(
          this.tokenUrl,
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: this.buildBasicAuthHeader(),
            },
          },
        ),
      );
      return data;
    } catch {
      throw new BadRequestException('فشل في تجديد رمز الوصول لـ Snapchat');
    }
  }

  private async fetchUserProfile(accessToken: string): Promise<SnapchatUserResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<SnapchatUserResponse>(
          this.userInfoUrl,
          {
            params: { query: '{me{externalId,displayName,bitmoji{avatar}}}' },
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        ),
      );
      return data;
    } catch {
      throw new BadRequestException('فشل في جلب بيانات حساب Snapchat');
    }
  }

  private extractStatistics(meData: SnapchatUserResponse['data']['me']): SnapchatPlatformStatistics {
    return {
      displayName: meData.displayName,
      bitmojiAvatarUrl: meData.bitmoji?.avatar ?? null,
      lastFetchedAt: new Date().toISOString(),
    };
  }

  private async upsertPlatform(
    userId: string,
    platformUserId: string,
    platformUsername: string,
    accessToken: string,
    refreshToken: string | null,
    tokenExpiresAt: Date,
    profileData: Record<string, any>,
    statistics: Record<string, any>,
  ): Promise<SocialPlatform> {
    const existing = await this.socialPlatformRepo.findOne({
      where: { userId, platform: Platform.SNAPCHAT },
    });

    if (existing) {
      await this.socialPlatformRepo.update(existing.id, {
        platformUserId,
        platformUsername,
        accessToken,
        pageAccessToken: refreshToken,
        tokenExpiresAt,
        profileData,
        statistics,
        lastSyncedAt: new Date(),
      });
      return this.socialPlatformRepo.findOne({ where: { id: existing.id } });
    }

    const record = this.socialPlatformRepo.create({
      userId,
      platform: Platform.SNAPCHAT,
      platformUserId,
      platformUsername,
      accessToken,
      pageAccessToken: refreshToken,
      tokenExpiresAt,
      profileData,
      statistics,
      lastSyncedAt: new Date(),
    });

    return this.socialPlatformRepo.save(record);
  }

  private async findUserPlatforms(userId: string): Promise<SocialPlatform[]> {
    return this.socialPlatformRepo.find({
      where: { userId },
      select: [
        'id',
        'platform',
        'platformUserId',
        'platformUsername',
        'profileData',
        'statistics',
        'connectedAt',
        'lastSyncedAt',
      ],
    });
  }

  private calculateTokenExpiry(expiresIn: number): Date {
    return new Date(Date.now() + expiresIn * 1000);
  }

  private isTokenNearExpiry(tokenExpiresAt: Date | null): boolean {
    if (!tokenExpiresAt) return false;
    const minutesUntilExpiry =
      (tokenExpiresAt.getTime() - Date.now()) / (1000 * 60);
    return minutesUntilExpiry <= 10;
  }
}
