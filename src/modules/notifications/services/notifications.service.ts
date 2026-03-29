import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { FcmTokenService } from './fcm-token.service';
import { FcmService } from './fcm.service';
import { UsersService } from '../../users/users.service';
import { NotificationType } from '../enums';
import { Role } from '../../../common/enums';
import { PaginatedResult } from '../../../common/interfaces';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly fcmTokenService: FcmTokenService,
    private readonly fcmService: FcmService,
    private readonly usersService: UsersService,
  ) {}

  async notify(
    recipientId: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>,
  ): Promise<void> {
    await this.notificationRepository.save(
      this.notificationRepository.create({ recipientId, title, body, type, data }),
    );

    const tokens = await this.fcmTokenService.findTokensByUserId(recipientId);
    if (tokens.length > 0) {
      await this.fcmService.sendToTokens(tokens, title, body, data);
    }
  }

  async notifyByRole(
    role: Role,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>,
  ): Promise<void> {
    const recipientIds = await this.usersService.findIdsByRole(role);

    if (recipientIds.length > 0) {
      const rows = recipientIds.map((recipientId) =>
        this.notificationRepository.create({ recipientId, title, body, type, data }),
      );
      await this.notificationRepository.save(rows);
    }

    const tokens = await this.fcmTokenService.findTokensByRole(role);
    if (tokens.length > 0) {
      await this.fcmService.sendToTokens(tokens, title, body, data);
    }
  }

  async getMyNotifications(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Notification>> {
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { recipientId: userId, isRead: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, pagination: { total, page, limit } };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    await this.notificationRepository.update(notificationId, { isRead: true });
  }
}
