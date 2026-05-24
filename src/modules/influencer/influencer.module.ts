import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { InfluencerProfile } from './entities/influencer-profile.entity';
import { CampaignApplication } from '../campaign/applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../campaign/invitations/entities/campaign-invited-influencer.entity';
import { SocialPlatform } from '../social-linking/entities/social-platform.entity';
import { User } from '../users/entities/user.entity';
import { InfluencerAuthController } from './auth/controllers/influencer-auth.controller';
import { InfluencerProfileController } from './profile/controllers/influencer-profile.controller';
import { InfluencerAdminController } from './admin/controllers/influencer-admin.controller';
import { AdvertiserInfluencerDiscoveryController } from './discovery/controllers/advertiser-influencer-discovery.controller';
import { InfluencerAuthService } from './auth/services/influencer-auth.service';
import { InfluencerProfileQueryService } from './profile/services/influencer-profile-query.service';
import { InfluencerProfileValidationService } from './profile/services/influencer-profile-validation.service';
import { InfluencerProfileManagementService } from './profile/services/influencer-profile-management.service';
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
import { ContentTypesModule } from '../content-types/content-types.module';
import { ImplementationTypesModule } from '../implementation-types/implementation-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InfluencerProfile,
      CampaignApplication,
      CampaignInvitedInfluencer,
      SocialPlatform,
      User,
    ]),
    PassportModule,
    JwtModule.register({}),
    HttpModule,
    UsersModule,
    forwardRef(() => SocialLinkingModule),
    MailModule,
    CountriesModule,
    NotificationsModule,
    PlatformSettingsModule,
    CloudinaryModule,
    CategoriesModule,
    ContentTypesModule,
    ImplementationTypesModule,
  ],
  controllers: [
    InfluencerAuthController,
    InfluencerProfileController,
    InfluencerAdminController,
    AdvertiserInfluencerDiscoveryController,
  ],
  providers: [
    InfluencerAuthService,
    InfluencerProfileQueryService,
    InfluencerProfileValidationService,
    InfluencerProfileManagementService,
    InfluencerAdminService,
    AdvertiserInfluencerDiscoveryService,
    InfluencerAdvertiserHistoryService,
    TokenService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [
    InfluencerProfileQueryService,
    InfluencerProfileValidationService,
    InfluencerProfileManagementService,
  ],
})
export class InfluencerModule {}
