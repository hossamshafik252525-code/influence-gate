import {
  Controller,
  Post,
  Delete,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { User } from '../../users/entities/user.entity';
import { NotificationsService } from '../services/notifications.service';
import { FcmTokenService } from '../services/fcm-token.service';
import { RegisterFcmTokenDto, RemoveFcmTokenDto, PaginationDto } from '../dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly fcmTokenService: FcmTokenService,
  ) {}

  @Post('fcm-token')
  registerToken(
    @AuthUser() user: User,
    @Body() dto: RegisterFcmTokenDto,
  ): Promise<void> {
    return this.fcmTokenService.register(user.id, dto.token, dto.deviceType);
  }

  @Delete('fcm-token')
  removeToken(@Body() dto: RemoveFcmTokenDto): Promise<void> {
    return this.fcmTokenService.removeToken(dto.token);
  }

  @Get()
  getMyNotifications(@AuthUser() user: User, @Query() query: PaginationDto) {
    return this.notificationsService.getMyNotifications(user.id, query.page, query.limit);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @AuthUser() user: User): Promise<void> {
    return this.notificationsService.markAsRead(id, user.id);
  }
}
