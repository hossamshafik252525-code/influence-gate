import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSenderRole } from '../enums/chat-sender-role.enum';
import { SendMessageDto, GetMessagesQueryDto, GetChatsQueryDto } from '../dto';
import { PaginatedResult } from '../../../common/interfaces';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatMessagePayload } from '../interfaces/chat-message-payload.interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async getOrCreateAdvertiserChat(advertiserId: string): Promise<Chat> {
    const existing = await this.chatRepo.findOne({ where: { advertiserId } });
    if (existing) {
      return existing;
    }
    const chat = this.chatRepo.create({ advertiserId });
    return this.chatRepo.save(chat);
  }

  async getChatById(chatId: string): Promise<Chat> {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['advertiser'],
    });
    if (!chat) {
      throw new NotFoundException('المحادثة غير موجودة');
    }
    return chat;
  }

  async getAllChats(query: GetChatsQueryDto): Promise<PaginatedResult<Chat>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.chatRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.advertiser', 'advertiser')
      .orderBy('chat.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('chat.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.where(
        'advertiser.fullName ILIKE :search OR advertiser.email ILIKE :search',
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, pagination: { total, page, limit } };
  }

  async getMessages(
    chatId: string,
    query: GetMessagesQueryDto,
  ): Promise<PaginatedResult<ChatMessage>> {
    await this.getChatById(chatId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.messageRepo.findAndCount({
      where: { chatId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, pagination: { total, page, limit } };
  }

  async sendMessageAsAdvertiser(
    advertiserId: string,
    dto: SendMessageDto,
  ): Promise<ChatMessage> {
    const chat = await this.getOrCreateAdvertiserChat(advertiserId);
    return this.persistAndBroadcast(
      chat.id,
      advertiserId,
      ChatSenderRole.ADVERTISER,
      dto,
    );
  }

  async sendMessageAsAdmin(
    chatId: string,
    adminId: string,
    dto: SendMessageDto,
  ): Promise<ChatMessage> {
    await this.getChatById(chatId);
    return this.persistAndBroadcast(chatId, adminId, ChatSenderRole.ADMIN, dto);
  }

  private async persistAndBroadcast(
    chatId: string,
    senderId: string,
    senderRole: ChatSenderRole,
    dto: SendMessageDto,
  ): Promise<ChatMessage> {
    const message = this.messageRepo.create({
      chatId,
      senderId,
      senderRole,
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      attachmentPublicId: dto.attachmentPublicId,
    });
    const saved = await this.messageRepo.save(message);

    await this.chatRepo.update(chatId, { lastMessageAt: saved.createdAt });

    const payload: ChatMessagePayload = {
      id: saved.id,
      chatId: saved.chatId,
      senderId: saved.senderId,
      senderRole: saved.senderRole,
      content: saved.content,
      attachmentUrl: saved.attachmentUrl ?? null,
      createdAt: saved.createdAt,
    };
    this.chatGateway.broadcastMessage(payload);

    return saved;
  }
}
