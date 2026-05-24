import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { SocialProviderStrategy } from '../../interfaces/social-provider.interface';
import { SocialPlatform } from '../../entities/social-platform.entity';
import { InfluencerProfile } from '../../../influencer/entities/influencer-profile.entity';
import { InfluencerFollowerSyncService } from '../../services/influencer-follower-sync.service';
import { PlatformsService } from '../../../platforms/platforms.service';
import {
  MetaTokenResponse,
  MetaFacebookProfile,
  MetaPagesResponse,
  MetaInstagramProfile,
  PlatformStatistics,
} from './meta.types';

@Injectable()
export class MetaStrategy implements SocialProviderStrategy {
  private readonly graphUrl: string;
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly callbackUrl: string;
  private readonly apiVersion: string;

  constructor(
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly followerSyncService: InfluencerFollowerSyncService,
    private readonly platformsService: PlatformsService,
  ) {
    this.apiVersion = this.configService.get<string>('meta.graphApiVersion');
    this.graphUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.appId = this.configService.get<string>('meta.appId');
    this.appSecret = this.configService.get<string>('meta.appSecret');
    this.callbackUrl = this.configService.get<string>('meta.callbackUrl');
  }

  getAuthUrl(): { url: string } {
    const scopes = [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    const url =
      `https://www.facebook.com/${this.apiVersion}/dialog/oauth` +
      `?client_id=${this.appId}` +
      `&redirect_uri=${encodeURIComponent(this.callbackUrl)}` +
      `&scope=${scopes}` +
      `&response_type=code`;

    return { url };
  }

  async handleCallback(code: string, userId: string): Promise<SocialPlatform[]> {
    const influencerProfileId = await this.resolveProfileId(userId);

    const shortLivedToken = await this.exchangeCodeForToken(code);
    const longLivedToken = await this.exchangeForLongLivedToken(shortLivedToken);
    const tokenExpiresAt = this.calculateTokenExpiry();

    const facebookProfile = await this.fetchFacebookProfile(longLivedToken);
    const facebookStats = this.extractFacebookStatistics(facebookProfile);

    await this.upsertPlatform(
      influencerProfileId,
      'facebook',
      facebookProfile.id,
      facebookProfile.name,
      longLivedToken,
      null,
      tokenExpiresAt,
      facebookProfile,
      facebookStats,
    );

    const instagramAccount = await this.discoverInstagramAccount(longLivedToken);
    if (instagramAccount) {
      const igProfile = await this.fetchInstagramProfile(
        instagramAccount.igUserId,
        longLivedToken,
      );
      const igStats = this.extractInstagramStatistics(igProfile);

      await this.upsertPlatform(
        influencerProfileId,
        'instagram',
        instagramAccount.igUserId,
        igProfile.username,
        longLivedToken,
        instagramAccount.pageAccessToken,
        tokenExpiresAt,
        igProfile,
        igStats,
      );
    }

    await this.followerSyncService.recomputeForProfile(influencerProfileId);

    return this.findUserPlatforms(influencerProfileId);
  }

  async refreshStats(record: SocialPlatform): Promise<Record<string, any>> {
    if (record.platform?.name === 'instagram') {
      return this.refreshInstagramStats(record);
    }
    return this.refreshFacebookStats(record);
  }

  async refreshToken(record: SocialPlatform): Promise<string> {
    if (!this.isTokenNearExpiry(record.tokenExpiresAt)) {
      return record.accessToken;
    }

    const newToken = await this.exchangeForLongLivedToken(record.accessToken);
    await this.socialPlatformRepo.update(record.id, {
      accessToken: newToken,
      tokenExpiresAt: this.calculateTokenExpiry(),
    });

    return newToken;
  }

  private async refreshInstagramStats(
    record: SocialPlatform,
  ): Promise<Record<string, any>> {
    const token = record.pageAccessToken || record.accessToken;
    const profile = await this.fetchInstagramProfile(record.platformUserId, token);
    return this.extractInstagramStatistics(profile);
  }

  private async refreshFacebookStats(
    record: SocialPlatform,
  ): Promise<Record<string, any>> {
    const profile = await this.fetchFacebookProfile(record.accessToken);
    return this.extractFacebookStatistics(profile);
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<MetaTokenResponse>(
          `${this.graphUrl}/oauth/access_token`,
          {
            params: {
              client_id: this.appId,
              client_secret: this.appSecret,
              redirect_uri: this.callbackUrl,
              code,
            },
          },
        ),
      );
      return data.access_token;
    } catch {
      throw new BadRequestException('فشل في تبادل رمز التفويض');
    }
  }

  private async exchangeForLongLivedToken(
    shortLivedToken: string,
  ): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<MetaTokenResponse>(
          `${this.graphUrl}/oauth/access_token`,
          {
            params: {
              grant_type: 'fb_exchange_token',
              client_id: this.appId,
              client_secret: this.appSecret,
              fb_exchange_token: shortLivedToken,
            },
          },
        ),
      );
      return data.access_token;
    } catch {
      throw new BadRequestException('فشل في الحصول على رمز الوصول طويل الأمد');
    }
  }

  private async fetchFacebookProfile(
    accessToken: string,
  ): Promise<MetaFacebookProfile> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<MetaFacebookProfile>(`${this.graphUrl}/me`, {
          params: {
            fields: 'id,name,picture{url},fan_count,followers_count',
            access_token: accessToken,
          },
        }),
      );
      return data;
    } catch {
      throw new BadRequestException('فشل في جلب بيانات فيسبوك');
    }
  }

  private async discoverInstagramAccount(
    accessToken: string,
  ): Promise<{ igUserId: string; pageAccessToken: string } | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<MetaPagesResponse>(
          `${this.graphUrl}/me/accounts`,
          {
            params: {
              fields:
                'id,name,access_token,instagram_business_account{id,username}',
              access_token: accessToken,
            },
          },
        ),
      );

      for (const page of data.data || []) {
        if (page.instagram_business_account) {
          return {
            igUserId: page.instagram_business_account.id,
            pageAccessToken: page.access_token,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private async fetchInstagramProfile(
    igUserId: string,
    accessToken: string,
  ): Promise<MetaInstagramProfile> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<MetaInstagramProfile>(
          `${this.graphUrl}/${igUserId}`,
          {
            params: {
              fields:
                'followers_count,follows_count,media_count,username,biography,profile_picture_url',
              access_token: accessToken,
            },
          },
        ),
      );
      return data;
    } catch {
      throw new BadRequestException('فشل في جلب بيانات انستغرام');
    }
  }

  private extractFacebookStatistics(
    profile: MetaFacebookProfile,
  ): PlatformStatistics {
    return {
      followersCount: profile.followers_count || 0,
      fanCount: profile.fan_count || 0,
      lastFetchedAt: new Date().toISOString(),
    };
  }

  private extractInstagramStatistics(
    profile: MetaInstagramProfile,
  ): PlatformStatistics {
    return {
      followersCount: profile.followers_count || 0,
      followsCount: profile.follows_count || 0,
      mediaCount: profile.media_count || 0,
      lastFetchedAt: new Date().toISOString(),
    };
  }

  private async upsertPlatform(
    influencerProfileId: string,
    platform: string,
    platformUserId: string,
    platformUsername: string | null,
    accessToken: string,
    pageAccessToken: string | null,
    tokenExpiresAt: Date,
    profileData: Record<string, any>,
    statistics: Record<string, any>,
  ): Promise<SocialPlatform> {
    const platformRow = await this.platformsService.findByName(platform);
    if (!platformRow) {
      throw new NotFoundException('هذه المنصة غير مسجلة في النظام');
    }
    const platformId = platformRow.id;

    const existing = await this.socialPlatformRepo.findOne({
      where: { influencerProfileId, platformId },
    });

    if (existing) {
      await this.socialPlatformRepo.update(existing.id, {
        platformUserId,
        platformUsername,
        accessToken,
        pageAccessToken,
        tokenExpiresAt,
        profileData,
        statistics,
        lastSyncedAt: new Date(),
      });
      return this.socialPlatformRepo.findOne({ where: { id: existing.id } });
    }

    const record = this.socialPlatformRepo.create({
      influencerProfileId,
      platformId,
      platformUserId,
      platformUsername,
      accessToken,
      pageAccessToken,
      tokenExpiresAt,
      profileData,
      statistics,
      lastSyncedAt: new Date(),
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

  private calculateTokenExpiry(): Date {
    return new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  }

  private isTokenNearExpiry(tokenExpiresAt: Date | null): boolean {
    if (!tokenExpiresAt) return false;
    const daysUntilExpiry =
      (tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 7;
  }
}
