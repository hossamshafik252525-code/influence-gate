import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { ChatService } from '../services/chat.service';
import { Role } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { SendMessageDto } from '../dto';
import { ChatMessagePayload } from '../interfaces/chat-message-payload.interface';

const ADMINS_ROOM = 'admins';
const chatRoom = (chatId: string): string => `chat:${chatId}`;

interface AuthenticatedSocket extends Socket {
  data: {
    user: User;
  };
}

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(socket);
      if (!token) {
        return this.reject(socket, 'لا يوجد رمز مصادقة');
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        { secret: this.configService.get<string>('jwt.accessSecret') },
      );

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isLoggedIn) {
        return this.reject(socket, 'مستخدم غير مصرح له');
      }

      socket.data.user = user;

      if (user.role === Role.ADMIN || user.role === Role.OWNER) {
        await socket.join(ADMINS_ROOM);
      } else if (user.role === Role.ADVERTISER) {
        const chat = await this.chatService.getOrCreateAdvertiserChat(user.id);
        await socket.join(chatRoom(chat.id));
      } else {
        return this.reject(socket, 'دور غير مسموح به');
      }
    } catch (error) {
      this.logger.warn(`Socket connection rejected: ${(error as Error).message}`);
      this.reject(socket, 'مصادقة فاشلة');
    }
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    const userId = socket.data?.user?.id;
    if (userId) {
      this.logger.debug(`Socket disconnected for user ${userId}`);
    }
  }

  @SubscribeMessage('chat:join')
  async onJoinChat(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { chatId: string },
  ): Promise<{ joined: boolean }> {
    const user = socket.data.user;
    if (user.role !== Role.ADMIN && user.role !== Role.OWNER) {
      return { joined: false };
    }
    if (!body?.chatId) {
      return { joined: false };
    }
    await socket.join(chatRoom(body.chatId));
    return { joined: true };
  }

  @SubscribeMessage('message:send')
  async onSendMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: SendMessageDto & { chatId?: string },
  ): Promise<{ ok: boolean; error?: string }> {
    const user = socket.data.user;
    const dto: SendMessageDto = {
      content: body.content,
      attachmentUrl: body.attachmentUrl,
      attachmentPublicId: body.attachmentPublicId,
    };

    if (!dto.content || dto.content.trim().length === 0) {
      return { ok: false, error: 'محتوى الرسالة مطلوب' };
    }

    try {
      if (user.role === Role.ADVERTISER) {
        await this.chatService.sendMessageAsAdvertiser(user.id, dto);
        return { ok: true };
      }
      if (user.role === Role.ADMIN || user.role === Role.OWNER) {
        if (!body.chatId) {
          return { ok: false, error: 'معرّف المحادثة مطلوب' };
        }
        await this.chatService.sendMessageAsAdmin(body.chatId, user.id, dto);
        return { ok: true };
      }
      return { ok: false, error: 'دور غير مسموح به' };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  broadcastMessage(payload: ChatMessagePayload): void {
    if (!this.server) return;
    this.server.to(chatRoom(payload.chatId)).except(ADMINS_ROOM).emit('message:new', payload);
    this.server.to(ADMINS_ROOM).emit('message:new', payload);
  }

  private extractToken(socket: Socket): string | null {
    const auth = socket.handshake?.auth as { token?: string } | undefined;
    if (auth?.token) {
      return auth.token.replace(/^Bearer\s+/i, '');
    }
    const header = socket.handshake?.headers?.authorization;
    if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
      return header.slice(7);
    }
    return null;
  }

  private reject(socket: Socket, reason: string): void {
    socket.emit('auth:error', { message: reason });
    socket.disconnect(true);
  }
}
