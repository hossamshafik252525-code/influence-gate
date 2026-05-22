import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Chat } from './chat.entity';
import { ChatSenderRole } from '../enums/chat-sender-role.enum';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  chatId: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;

  @Column()
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'enum', enum: ChatSenderRole })
  senderRole: ChatSenderRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  attachmentPublicId: string;

  @CreateDateColumn()
  createdAt: Date;
}
