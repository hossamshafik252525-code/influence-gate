import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SocialPlatform } from './entities/social-platform.entity';
import { Platform } from '../../common/enums';

@Injectable()
export class SocialLinkingService {
  private readonly META_GRAPH_URL: string;
  private readonly META_APP_ID: string;
  private readonly META_APP_SECRET: string;
  private readonly META_CALLBACK_URL: string;

  constructor(
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const version = this.configService.get<string>('meta.graphApiVersion');
    this.META_GRAPH_URL = `https://graph.facebook.com/${version}`;
    this.META_APP_ID = this.configService.get<string>('meta.appId');
    this.META_APP_SECRET = this.configService.get<string>('meta.appSecret');
    this.META_CALLBACK_URL = this.configService.get<string>('meta.callbackUrl');
  }

  getMetaAuthUrl(): { url: string } {
    const scopes = [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    const url =
      `https://www.facebook.com/${this.configService.get<string>('meta.graphApiVersion')}/dialog/oauth` +
      `?client_id=${this.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(this.META_CALLBACK_URL)}` +
      `&scope=${scopes}` +
      `&response_type=code`;

    return { url };
  }

  async handleMetaCallback(code: string, userId: string) {
    const shortLivedToken = await this.exchangeCodeForToken(code);
    const longLivedToken = await this.exchangeForLongLivedToken(shortLivedToken);
    const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const facebookData = await this.fetchFacebookProfile(longLivedToken);
    await this.savePlatform(
      userId,
      Platform.FACEBOOK,
      facebookData.id,
      facebookData.name,
      longLivedToken,
      null,
      tokenExpiresAt,
      facebookData,
    );

    const instagramData = await this.discoverInstagramAccount(longLivedToken);
    if (instagramData) {
      const igStats = await this.fetchInstagramStats(
        instagramData.igUserId,
        longLivedToken,
      );

      await this.savePlatform(
        userId,
        Platform.INSTAGRAM,
        instagramData.igUserId,
        igStats.username,
        longLivedToken,
        instagramData.pageAccessToken,
        tokenExpiresAt,
        igStats,
      );
    }

    return this.getLinkedPlatforms(userId);
  }

  async getLinkedPlatforms(userId: string) {
    const platforms = await this.socialPlatformRepo.find({
      where: { userId },
      select: [
        'id',
        'platform',
        'platformUserId',
        'platformUsername',
        'profileData',
        'connectedAt',
        'lastSyncedAt',
      ],
    });

    return { platforms };
  }

  async hasLinkedPlatforms(userId: string): Promise<boolean> {
    const count = await this.socialPlatformRepo.count({ where: { userId } });
    return count > 0;
  }

  async refreshStats(userId: string, platform: Platform) {
    const record = await this.socialPlatformRepo.findOne({
      where: { userId, platform },
    });

    if (!record) {
      throw new NotFoundException('هذه المنصة غير مرتبطة بحسابك');
    }

    await this.refreshTokenIfNeeded(record);

    let profileData: Record<string, any>;

    if (platform === Platform.INSTAGRAM) {
      profileData = await this.fetchInstagramStats(
        record.platformUserId,
        record.pageAccessToken || record.accessToken,
      );
    } else {
      profileData = await this.fetchFacebookProfile(record.accessToken);
    }

    await this.socialPlatformRepo.update(record.id, {
      profileData,
      lastSyncedAt: new Date(),
    });

    return this.getLinkedPlatforms(userId);
  }

  async unlinkPlatform(userId: string, platform: Platform) {
    const record = await this.socialPlatformRepo.findOne({
      where: { userId, platform },
    });

    if (!record) {
      throw new NotFoundException('هذه المنصة غير مرتبطة بحسابك');
    }

    await this.socialPlatformRepo.remove(record);

    return { message: 'تم إلغاء ربط المنصة بنجاح' };
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.META_GRAPH_URL}/oauth/access_token`, {
          params: {
            client_id: this.META_APP_ID,
            client_secret: this.META_APP_SECRET,
            redirect_uri: this.META_CALLBACK_URL,
            code,
          },
        }),
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
        this.httpService.get(`${this.META_GRAPH_URL}/oauth/access_token`, {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.META_APP_ID,
            client_secret: this.META_APP_SECRET,
            fb_exchange_token: shortLivedToken,
          },
        }),
      );
      return data.access_token;
    } catch {
      throw new BadRequestException('فشل في الحصول على رمز الوصول طويل الأمد');
    }
  }

  private async fetchFacebookProfile(
    accessToken: string,
  ): Promise<Record<string, any>> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.META_GRAPH_URL}/me`, {
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
        this.httpService.get(`${this.META_GRAPH_URL}/me/accounts`, {
          params: {
            fields: 'id,name,access_token,instagram_business_account{id,username}',
            access_token: accessToken,
          },
        }),
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

  private async fetchInstagramStats(
    igUserId: string,
    accessToken: string,
  ): Promise<Record<string, any>> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.META_GRAPH_URL}/${igUserId}`, {
          params: {
            fields:
              'followers_count,follows_count,media_count,username,biography,profile_picture_url',
            access_token: accessToken,
          },
        }),
      );
      return data;
    } catch {
      throw new BadRequestException('فشل في جلب بيانات انستغرام');
    }
  }

  private async refreshTokenIfNeeded(record: SocialPlatform): Promise<void> {
    if (!record.tokenExpiresAt) return;

    const daysUntilExpiry =
      (record.tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiry > 7) return;

    try {
      const newToken = await this.exchangeForLongLivedToken(record.accessToken);
      await this.socialPlatformRepo.update(record.id, {
        accessToken: newToken,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      });
      record.accessToken = newToken;
    } catch {
      throw new BadRequestException(
        'انتهت صلاحية الرمز، يرجى إعادة ربط الحساب',
      );
    }
  }

  private async savePlatform(
    userId: string,
    platform: Platform,
    platformUserId: string,
    platformUsername: string | null,
    accessToken: string,
    pageAccessToken: string | null,
    tokenExpiresAt: Date,
    profileData: Record<string, any>,
  ): Promise<SocialPlatform> {
    const existing = await this.socialPlatformRepo.findOne({
      where: { userId, platform },
    });

    if (existing) {
      await this.socialPlatformRepo.update(existing.id, {
        platformUserId,
        platformUsername,
        accessToken,
        pageAccessToken,
        tokenExpiresAt,
        profileData,
        lastSyncedAt: new Date(),
      });
      return this.socialPlatformRepo.findOne({ where: { id: existing.id } });
    }

    const record = this.socialPlatformRepo.create({
      userId,
      platform,
      platformUserId,
      platformUsername,
      accessToken,
      pageAccessToken,
      tokenExpiresAt,
      profileData,
      lastSyncedAt: new Date(),
    });

    return this.socialPlatformRepo.save(record);
  }
}
