import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdvertiserAuthController } from './auth/controllers/advertiser-auth.controller';
import { AdvertiserAuthService } from './auth/services/advertiser-auth.service';
import { AdvertiserProfileController } from './profile/controllers/advertiser-profile.controller';
import { AdvertiserProfileQueryService } from './profile/services/advertiser-profile-query.service';
import { AdvertiserProfileManagementService } from './profile/services/advertiser-profile-management.service';
import { AdvertiserProfile } from './entities/advertiser-profile.entity';
import { TokenService, JwtStrategy, JwtRefreshStrategy } from '../../common/auth';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { CategoriesModule } from '../categories/categories.module';
import { CountriesModule } from '../countries/countries.module';
import { ContentTypesModule } from '../content-types/content-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdvertiserProfile]),
    PassportModule,
    JwtModule.register({}),
    UsersModule,
    MailModule,
    CategoriesModule,
    CountriesModule,
    ContentTypesModule,
  ],
  controllers: [AdvertiserAuthController, AdvertiserProfileController],
  providers: [
    AdvertiserAuthService,
    AdvertiserProfileQueryService,
    AdvertiserProfileManagementService,
    TokenService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AdvertiserModule {}
