import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SocialLinkingService } from './social-linking.service';
import { User } from './entities/user.entity';
import { SocialPlatform } from './entities/social-platform.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SocialPlatform]),
    HttpModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, SocialLinkingService],
  exports: [UsersService, SocialLinkingService],
})
export class UsersModule {}
