import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { UsersService } from '../../../users/users.service';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { Role, UserStatus } from '../../../../common/enums';
import { NotificationType } from '../../../notifications/enums';
import { PaginationQueryDto } from '../../../../common/dto';
import { PaginatedResult } from '../../../../common/interfaces';

@Injectable()
export class InfluencerAdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async confirmInfluencer(influencerId: string): Promise<void> {
    const user = await this.usersService.findById(influencerId);

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.role !== Role.INFLUENCER) {
      throw new BadRequestException('المستخدم ليس مؤثراً');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException('المستخدم ليس في حالة انتظار');
    }

    await this.usersService.update(influencerId, { status: UserStatus.CONFIRMED });

    await this.notificationsService.notify(
      influencerId,
      'تم قبول حسابك',
      'تم تأكيد حسابك بنجاح، يمكنك الآن الوصول إلى جميع الميزات',
      NotificationType.ACCOUNT_APPROVED,
      {},
    );
  }

  async getPendingInfluencers(query: PaginationQueryDto): Promise<PaginatedResult<User>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepo.findAndCount({
      where: { role: Role.INFLUENCER, status: UserStatus.PENDING },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      pagination: { total, page, limit },
    };
  }
}
