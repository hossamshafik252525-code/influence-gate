import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { SocialProviderStrategy } from '../../interfaces/social-provider.interface';
import { SocialPlatform } from '../../entities/social-platform.entity';
import { Platform } from '../../../../common/enums';
import { InfluencerProfile } from '../../../influencer/entities/influencer-profile.entity';
import {
  TikTokTokenResponse,
  TikTokUserInfoResponse,
  TikTokPlatformStatistics,
} from './tiktok.types';

@Injectable()
export class TikTokStrategy implements SocialProviderStrategy {
  private readonly logger: Logger = new Logger(TikTokStrategy.name);
  private readonly authUrl: string = 'https://www.tiktok.com/v2/auth/authorize/';
  private readonly tokenUrl: string = 'https://open.tiktokapis.com/v2/oauth/token/';
  private readonly userInfoUrl: string = 'https://open.tiktokapis.com/v2/user/info/';
  private readonly clientKey: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;
  private readonly scopes: string;
  private readonly deepLinkBase: string;

  private readonly basicFields: string = 'open_id,union_id,avatar_url,avatar_large_url,display_name';
  private readonly profileFields: string = 'bio_description,profile_deep_link,is_verified,username';
  private readonly statsFields: string = 'follower_count,following_count,likes_count,video_count';

  constructor(
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.clientKey = this.configService.get<string>('tiktok.clientKey');
    this.clientSecret = this.configService.get<string>('tiktok.clientSecret');
    this.callbackUrl = this.configService.get<string>('tiktok.callbackUrl');
    this.scopes = this.configService.get<string>('tiktok.scopes') || 'user.info.basic';
    this.deepLinkBase = this.configService.get<string>('tiktok.deepLinkBase') || 'influencegate://tiktok-success';
  }

  getAuthUrl(userId: string): { url: string } {
    const redirectUriEncoded = encodeURIComponent(this.callbackUrl);

    const url =
      `${this.authUrl}` +
      `?client_key=${this.clientKey}` +
      `&scope=${this.scopes}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUriEncoded}` +
      `&state=${userId}`;

    this.logger.log(
      JSON.stringify({
        event: 'tiktok_oauth_auth_url_created',
        userId,
        callbackUrl: this.callbackUrl,
        redirectUriEncoded,
        scopes: this.scopes,
      }),
    );

    return { url };
  }

  buildSuccessDeepLink(): string {
    return `${this.deepLinkBase}?status=success`;
  }

  buildErrorDeepLink(message: string): string {
    return `${this.deepLinkBase}?status=error&message=${encodeURIComponent(message)}`;
  }

  async handleCallback(code: string, userId: string): Promise<SocialPlatform[]> {
    const influencerProfileId = await this.resolveProfileId(userId);

    const tokenData = await this.exchangeCodeForTokens(code);
    const tokenExpiresAt = this.calculateTokenExpiry(tokenData.expires_in);
    const refreshTokenExpiresAt = this.calculateTokenExpiry(tokenData.refresh_expires_in);
    const grantedScopes = this.parseScopes(tokenData.scope);

    const userInfo = await this.fetchUserInfo(tokenData.access_token, grantedScopes);
    const userData = userInfo.data.user;
    const statistics = this.extractStatistics(userData);

    await this.upsertPlatform(
      influencerProfileId,
      tokenData.open_id,
      userData.username ?? userData.display_name,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenExpiresAt,
      refreshTokenExpiresAt,
      grantedScopes,
      userData,
      statistics,
    );

    return this.findUserPlatforms(influencerProfileId);
  }

  async refreshStats(record: SocialPlatform): Promise<Record<string, any>> {
    const profileData = this.normalizeObject(record.profileData);
    const scopes = this.resolveScopesFromProfileData(profileData);
    const userInfo = await this.fetchUserInfo(record.accessToken, scopes);
    return this.extractStatistics(userInfo.data.user);
  }

  async refreshToken(record: SocialPlatform): Promise<string> {
    if (!this.isTokenNearExpiry(record.tokenExpiresAt)) {
      return record.accessToken;
    }

    const refreshToken = record.pageAccessToken;
    if (!refreshToken) {
      return record.accessToken;
    }

    const newTokenData = await this.performTokenRefresh(refreshToken);

    await this.socialPlatformRepo.update(record.id, {
      accessToken: newTokenData.access_token,
      pageAccessToken: newTokenData.refresh_token,
      tokenExpiresAt: this.calculateTokenExpiry(newTokenData.expires_in),
    });

    return newTokenData.access_token;
  }

  private async exchangeCodeForTokens(code: string): Promise<TikTokTokenResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<TikTokTokenResponse>(
          this.tokenUrl,
          new URLSearchParams({
            client_key: this.clientKey,
            client_secret: this.clientSecret,
            code: decodeURIComponent(code),
            grant_type: 'authorization_code',
            redirect_uri: this.callbackUrl,
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        ),
      );
      if (!data?.access_token || !data?.open_id || !data?.refresh_token) {
        const responseData = this.normalizeObject(data);
        const errorMessage = this.extractTikTokOAuthError(responseData);
        this.logger.warn(
          JSON.stringify({
            event: 'tiktok_oauth_token_exchange_invalid_payload',
            callbackUrl: this.callbackUrl,
            response: responseData,
          }),
        );
        throw new BadRequestException(errorMessage);
      }
      return data;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const status = this.extractAxiosStatus(error);
      const data = this.extractAxiosData(error);
      this.logger.warn(
        JSON.stringify({
          event: 'tiktok_oauth_token_exchange_failed',
          status,
          callbackUrl: this.callbackUrl,
          response: data,
        }),
      );
      throw new BadRequestException('فشل في تبادل رمز التفويض مع TikTok');
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<TikTokTokenResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<TikTokTokenResponse>(
          this.tokenUrl,
          new URLSearchParams({
            client_key: this.clientKey,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        ),
      );
      return data;
    } catch (error: unknown) {
      const status = this.extractAxiosStatus(error);
      const data = this.extractAxiosData(error);
      this.logger.warn(
        JSON.stringify({
          event: 'tiktok_oauth_token_refresh_failed',
          status,
          response: data,
        }),
      );
      throw new BadRequestException('فشل في تجديد رمز الوصول لـ TikTok');
    }
  }

  private async fetchUserInfo(accessToken: string, grantedScopes: string[]): Promise<TikTokUserInfoResponse> {
    const fields = this.resolveUserInfoFields(grantedScopes);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<TikTokUserInfoResponse>(
          this.userInfoUrl,
          {
            params: { fields },
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        ),
      );

      if (data.error?.code !== 'ok') {
        throw new BadRequestException(data.error?.message ?? 'فشل في جلب بيانات TikTok');
      }

      return data;
    } catch (error: unknown) {
      const status = this.extractAxiosStatus(error);
      const data = this.extractAxiosData(error);
      this.logger.warn(
        JSON.stringify({
          event: 'tiktok_user_info_fetch_failed',
          status,
          fields,
          grantedScopes,
          response: data,
        }),
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('فشل في جلب بيانات حساب TikTok');
    }
  }

  private extractStatistics(userData: TikTokUserInfoResponse['data']['user']): TikTokPlatformStatistics {
    return {
      followerCount: userData.follower_count ?? 0,
      followingCount: userData.following_count ?? 0,
      likesCount: userData.likes_count ?? 0,
      videoCount: userData.video_count ?? 0,
      isVerified: userData.is_verified ?? false,
      lastFetchedAt: new Date().toISOString(),
    };
  }

  private async upsertPlatform(
    influencerProfileId: string,
    platformUserId: string,
    platformUsername: string,
    accessToken: string,
    refreshToken: string,
    tokenExpiresAt: Date,
    refreshTokenExpiresAt: Date,
    grantedScopes: string[],
    profileData: Record<string, any>,
    statistics: Record<string, any>,
  ): Promise<SocialPlatform> {
    const existing = await this.socialPlatformRepo.findOne({
      where: { influencerProfileId, platform: Platform.TIKTOK },
    });

    const platformData = {
      platformUserId,
      platformUsername,
      accessToken,
      pageAccessToken: refreshToken,
      tokenExpiresAt,
      profileData: Object.assign({}, profileData, {
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
        grantedScopes,
      }),
      statistics,
      lastSyncedAt: new Date(),
    };

    if (existing) {
      await this.socialPlatformRepo.update(existing.id, platformData);
      return this.socialPlatformRepo.findOne({ where: { id: existing.id } });
    }

    const record = this.socialPlatformRepo.create({
      influencerProfileId,
      platform: Platform.TIKTOK,
      ...platformData,
    });

    return this.socialPlatformRepo.save(record);
  }

  private async resolveProfileId(userId: string): Promise<string> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي للمؤثر غير موجود');
    }
    return profile.id;
  }

  private async findUserPlatforms(influencerProfileId: string): Promise<SocialPlatform[]> {
    return this.socialPlatformRepo.find({
      where: { influencerProfileId },
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
    const hoursUntilExpiry =
      (tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 2;
  }

  private extractAxiosStatus(error: unknown): number | null {
    if (!error || typeof error !== 'object') return null;
    const maybeResponse = (error as { response?: unknown }).response;
    if (!maybeResponse || typeof maybeResponse !== 'object') return null;
    const status = (maybeResponse as { status?: unknown }).status;
    return typeof status === 'number' ? status : null;
  }

  private extractAxiosData(error: unknown): Record<string, unknown> | null {
    if (!error || typeof error !== 'object') return null;
    const maybeResponse = (error as { response?: unknown }).response;
    if (!maybeResponse || typeof maybeResponse !== 'object') return null;
    const data = (maybeResponse as { data?: unknown }).data;
    if (!data || typeof data !== 'object') return null;
    return data as Record<string, unknown>;
  }

  private parseScopes(rawScopes: string): string[] {
    if (!rawScopes) {
      return ['user.info.basic'];
    }
    return rawScopes.split(',').map((scope) => scope.trim()).filter((scope) => scope.length > 0);
  }

  private resolveUserInfoFields(grantedScopes: string[]): string {
    const fields: string[] = [this.basicFields];
    if (grantedScopes.includes('user.info.profile')) {
      fields.push(this.profileFields);
    }
    if (grantedScopes.includes('user.info.stats')) {
      fields.push(this.statsFields);
    }
    return fields.join(',');
  }

  private normalizeObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private resolveScopesFromProfileData(profileData: Record<string, unknown>): string[] {
    const storedScopes = profileData.grantedScopes;
    if (Array.isArray(storedScopes)) {
      return storedScopes
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return this.parseScopes(this.scopes);
  }

  private extractTikTokOAuthError(responseData: Record<string, unknown>): string {
    const error = responseData.error;
    const errorDescription = responseData.error_description;
    if (typeof errorDescription === 'string' && errorDescription.trim().length > 0) {
      return errorDescription;
    }
    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }
    return 'استجابة TikTok لا تحتوي على رمز وصول صالح';
  }
}
