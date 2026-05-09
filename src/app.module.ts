import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { RedisModule } from './modules/redis/redis.module';
import { MailModule } from './modules/mail/mail.module';
import { UsersModule } from './modules/users/users.module';
import { SocialLinkingModule } from './modules/social-linking/social-linking.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { InfluencerModule } from './modules/influencer/influencer.module';
import { AdvertiserModule } from './modules/advertiser/advertiser.module';
import { CountriesModule } from './modules/countries/countries.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';
import { LandingPageModule } from './modules/landing-page/landing-page.module';
import { AdminModule } from './modules/admin/admin.module';
import { SupportModule } from './modules/support/support.module';
import { UploadModule } from './modules/upload/upload.module';
import { RatingModule } from './modules/rating/rating.module';
import { ContactUsModule } from './modules/contact-us/contact-us.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('database.url');
        return {
          type: 'postgres',
          ...(dbUrl
            ? { url: dbUrl }
            : {
                host: config.get<string>('database.host'),
                port: config.get<number>('database.port'),
                username: config.get<string>('database.username'),
                password: config.get<string>('database.password'),
                database: config.get<string>('database.name'),
              }),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    RedisModule,
    MailModule,
    UsersModule,
    SocialLinkingModule,
    CategoriesModule,
    InfluencerModule,
    AdvertiserModule,
    CountriesModule,
    NotificationsModule,
    CampaignModule,
    WalletModule,
    PlatformSettingsModule,
    LandingPageModule,
    AdminModule,
    SupportModule,
    UploadModule,
    RatingModule,
    ContactUsModule,
  ],
})
export class AppModule {}
