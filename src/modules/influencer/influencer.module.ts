import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { InfluencerProfile } from './entities/influencer-profile.entity';
import { InfluencerService } from './entities/influencer-service.entity';
import { CampaignApplication } from '../campaign/entities/campaign-application.entity';
import { InfluencerAuthController } from './auth/controllers/influencer-auth.controller';
import { InfluencerProfileController } from './profile/controllers/influencer-profile.controller';
import { InfluencerServiceController } from './services/controllers/influencer-service.controller';
import { InfluencerAuthService } from './auth/services/influencer-auth.service';
import { InfluencerProfileService } from './profile/services/influencer-profile.service';
import { InfluencerServiceService } from './services/services/influencer-service.service';
import { TokenService, JwtStrategy, JwtRefreshStrategy } from '../../common/auth';
import { UsersModule } from '../users/users.module';
import { SocialLinkingModule } from '../social-linking/social-linking.module';
import { MailModule } from '../mail/mail.module';
import { CountriesModule } from '../countries/countries.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InfluencerProfile, InfluencerService, CampaignApplication]),
    PassportModule,
    JwtModule.register({}),
    HttpModule,
    UsersModule,
    SocialLinkingModule,
    MailModule,
    CountriesModule,
    NotificationsModule,
  ],
  controllers: [InfluencerAuthController, InfluencerProfileController, InfluencerServiceController],
  providers: [
    InfluencerAuthService,
    InfluencerProfileService,
    InfluencerServiceService,
    TokenService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [InfluencerProfileService],
})
export class InfluencerModule {}
