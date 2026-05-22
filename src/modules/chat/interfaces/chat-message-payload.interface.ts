import { ChatSenderRole } from '../enums/chat-sender-role.enum';

export interface ChatMessagePayload {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: ChatSenderRole;
  content: string;
  attachmentUrl: string | null;
  createdAt: Date;
}
