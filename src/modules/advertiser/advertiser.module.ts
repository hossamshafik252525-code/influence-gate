import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdvertiserAuthController } from './auth/controllers/advertiser-auth.controller';
import { AdvertiserAuthService } from './auth/services/advertiser-auth.service';
import { AdvertiserProfileController } from './profile/controllers/advertiser-profile.controller';
import { AdvertiserProfileService } from './profile/services/advertiser-profile.service';
import { AdvertiserProfile } from './entities/advertiser-profile.entity';
import { TokenService, JwtStrategy, JwtRefreshStrategy } from '../../common/auth';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CategoriesModule } from '../categories/categories.module';
import { CountriesModule } from '../countries/countries.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdvertiserProfile]),
    PassportModule,
    JwtModule.register({}),
    UsersModule,
    MailModule,
    CloudinaryModule,
    CategoriesModule,
    CountriesModule,
  ],
  controllers: [AdvertiserAuthController, AdvertiserProfileController],
  providers: [
    AdvertiserAuthService,
    AdvertiserProfileService,
    TokenService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AdvertiserModule {}
