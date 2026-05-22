import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';
import { ChatService } from '../../services/chat.service';
import { SendMessageDto, GetMessagesQueryDto } from '../../dto';
import { Chat } from '../../entities/chat.entity';
import { ChatMessage } from '../../entities/chat-message.entity';
import { PaginatedResult } from '../../../../common/interfaces';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADVERTISER)
@Controller('advertiser/chat')
export class AdvertiserChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getMyChat(@AuthUser() user: User): Promise<Chat> {
    return this.chatService.getOrCreateAdvertiserChat(user.id);
  }

  @Get('messages')
  async getMyMessages(
    @AuthUser() user: User,
    @Query() query: GetMessagesQueryDto,
  ): Promise<PaginatedResult<ChatMessage>> {
    const chat = await this.chatService.getOrCreateAdvertiserChat(user.id);
    return this.chatService.getMessages(chat.id, query);
  }

  @Post('messages')
  sendMessage(
    @AuthUser() user: User,
    @Body() dto: SendMessageDto,
  ): Promise<ChatMessage> {
    return this.chatService.sendMessageAsAdvertiser(user.id, dto);
  }
}
