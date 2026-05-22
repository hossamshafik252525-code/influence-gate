import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { AdvertiserChatController } from './controllers/advertiser/advertiser-chat.controller';
import { AdminChatController } from './controllers/admin/admin-chat.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatMessage]),
    JwtModule.register({}),
    UsersModule,
  ],
  controllers: [AdvertiserChatController, AdminChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
