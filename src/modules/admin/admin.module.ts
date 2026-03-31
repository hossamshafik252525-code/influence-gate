import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminAuthService } from './services/admin-auth.service';
import { TokenService, JwtStrategy, JwtRefreshStrategy } from '../../common/auth';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    UsersModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, TokenService, JwtStrategy, JwtRefreshStrategy],
})
export class AdminModule {}
