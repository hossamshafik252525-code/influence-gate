import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { FcmService } from './services/fcm.service';
import { FcmTokenService } from './services/fcm-token.service';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, FcmToken]), UsersModule],
  controllers: [NotificationsController],
  providers: [FcmService, FcmTokenService, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
