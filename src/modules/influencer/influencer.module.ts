import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { InfluencerProfile } from './entities/influencer-profile.entity';
import { InfluencerService } from './entities/influencer-service.entity';
import { InfluencerCategory } from './entities/influencer-category.entity';
import { CampaignApplication } from '../campaign/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../campaign/entities/campaign-invited-influencer.entity';
import { SocialPlatform } from '../social-linking/entities/social-platform.entity';
import { User } from '../users/entities/user.entity';
import { InfluencerAuthController } from './auth/controllers/influencer-auth.controller';
import { InfluencerProfileController } from './profile/controllers/influencer-profile.controller';
import { InfluencerServiceController } from './services/controllers/influencer-service.controller';
import { InfluencerAdminController } from './admin/controllers/influencer-admin.controller';
import { AdvertiserInfluencerDiscoveryController } from './discovery/controllers/advertiser-influencer-discovery.controller';
import { InfluencerAuthService } from './auth/services/influencer-auth.service';
import { InfluencerProfileService } from './profile/services/influencer-profile.service';
import { InfluencerServiceService } from './services/services/influencer-service.service';
import { InfluencerAdminService } from './admin/services/influencer-admin.service';
import { AdvertiserInfluencerDiscoveryService } from './discovery/services/advertiser-influencer-discovery.service';
import { InfluencerAdvertiserHistoryService } from './discovery/services/influencer-advertiser-history.service';
import { TokenService, JwtStrategy, JwtRefreshStrategy } from '../../common/auth';
import { UsersModule } from '../users/users.module';
import { SocialLinkingModule } from '../social-linking/social-linking.module';
import { MailModule } from '../mail/mail.module';
import { CountriesModule } from '../countries/countries.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InfluencerProfile,
      InfluencerService,
      CampaignApplication,
      CampaignInvitedInfluencer,
      SocialPlatform,
      User,
      InfluencerCategory,
    ]),
    PassportModule,
    JwtModule.register({}),
    HttpModule,
    UsersModule,
    SocialLinkingModule,
    MailModule,
    CountriesModule,
    NotificationsModule,
    PlatformSettingsModule,
    CloudinaryModule,
    CategoriesModule,
  ],
  controllers: [
    InfluencerAuthController,
    InfluencerProfileController,
    InfluencerServiceController,
    InfluencerAdminController,
    AdvertiserInfluencerDiscoveryController,
  ],
  providers: [
    InfluencerAuthService,
    InfluencerProfileService,
    InfluencerServiceService,
    InfluencerAdminService,
    AdvertiserInfluencerDiscoveryService,
    InfluencerAdvertiserHistoryService,
    TokenService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [InfluencerProfileService],
})
export class InfluencerModule {}
