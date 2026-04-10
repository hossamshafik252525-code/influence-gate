import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { NotificationSetting } from './entities/notification-setting.entity';
import { FcmService } from './services/fcm.service';
import { FcmTokenService } from './services/fcm-token.service';
import { NotificationsService } from './services/notifications.service';
import { NotificationSettingsService } from './services/notification-settings.service';
import { NotificationsController } from './controllers/notifications.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, FcmToken, NotificationSetting]),
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [FcmService, FcmTokenService, NotificationsService, NotificationSettingsService],
  exports: [NotificationsService, NotificationSettingsService],
})
export class NotificationsModule {}
