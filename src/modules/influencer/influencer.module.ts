import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { InfluencerAuthController } from './auth/controllers/influencer-auth.controller';
import { InfluencerAuthService } from './auth/services/influencer-auth.service';
import { TokenService, JwtStrategy, JwtRefreshStrategy } from '../../common/auth';
import { UsersModule } from '../users/users.module';
import { SocialLinkingModule } from '../social-linking/social-linking.module';
import { MailModule } from '../mail/mail.module';
import { CountriesModule } from '../countries/countries.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    HttpModule,
    UsersModule,
    SocialLinkingModule,
    MailModule,
    CountriesModule,
    NotificationsModule,
  ],
  controllers: [InfluencerAuthController],
  providers: [InfluencerAuthService, TokenService, JwtStrategy, JwtRefreshStrategy],
  exports: [InfluencerAuthService],
})
export class InfluencerModule {}
