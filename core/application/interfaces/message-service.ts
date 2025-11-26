import type { Message } from "@/core/domain/messaging/message";

export interface MessagePayload extends Partial<Message> {}

export interface MessageService {
  getAll(): Promise<Message[]>;
  getById(id: string): Promise<Message | null>;
  create(payload: MessagePayload): Promise<Message>;
  update(payload: MessagePayload): Promise<Message | null>;
  delete(id: string): Promise<boolean>;
  getByConversationId(conversationId: string): Promise<Message[]>;
  getByPlatformMessageId(platformMessageId: string): Promise<Message | null>;
  markAsRead(messageId: string): Promise<void>;
}
