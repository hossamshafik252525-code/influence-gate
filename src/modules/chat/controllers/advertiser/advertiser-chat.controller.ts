import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { ChatService } from '../../services/chat.service';
import { GetMessagesQueryDto } from '../../dto';
import { ChatMessage } from '../../entities/chat-message.entity';
import { PaginatedResult } from '../../../../common/interfaces';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Controller('advertiser/chat')
export class AdvertiserChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getMyChat(
    @AuthUser() user: User,
    @Query() query: GetMessagesQueryDto,
  ): Promise<PaginatedResult<ChatMessage>> {
    const { messages } = await this.chatService.getAdvertiserChatWithMessages(user.id, query);
    return messages;
  }
}
