import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Role } from '../../../../common/enums';
import { ChatService } from '../../services/chat.service';
import { GetMessagesQueryDto, GetChatsQueryDto } from '../../dto';
import { Chat } from '../../entities/chat.entity';
import { ChatMessage } from '../../entities/chat-message.entity';
import { PaginatedResult } from '../../../../common/interfaces';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADMIN, Role.OWNER)
@Controller('admin/chats')
export class AdminChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getAllChats(
    @Query() query: GetChatsQueryDto,
  ): Promise<PaginatedResult<Chat>> {
    return this.chatService.getAllChats(query);
  }

  @Get(':chatId/messages')
  getChatMessages(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<PaginatedResult<ChatMessage>> {
    return this.chatService.getMessages(chatId, query);
  }
}
