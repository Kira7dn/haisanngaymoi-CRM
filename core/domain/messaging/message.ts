/**
 * Platform types for messaging
 */
export type Platform = "facebook" | "zalo" | "tiktok" | "website" | "telegram";

/**
 * Message sender type
 */
export type MessageSender = "customer" | "agent" | "system";

/**
 * Message delivery status
 */
export type DeliveryStatus = "sent" | "delivered" | "failed" | "pending";

/**
 * Attachment type for messages
 */
export interface Attachment {
  type: "image" | "file" | "video" | "audio";
  url: string;
  name?: string;
  size?: number; // in bytes
  mimeType?: string; // MIME type of the file
  thumbnailUrl?: string; // For images/videos
}

/**
 * Message domain entity
 * Represents a single message in a conversation
 */
export interface Message {
  id: string; // MongoDB ObjectId as string
  conversationId: string; // Reference to Conversation
  sender: MessageSender;
  senderId?: number; // User ID if sender is agent, customer ID if customer
  platformMessageId?: string; // External platform message ID for idempotency
  content: string;
  attachments?: Attachment[];
  sentAt: Date;
  deliveredAt?: Date; // When message was delivered to recipient
  readAt?: Date; // When message was read by recipient
  isRead?: boolean; // Deprecated: use readAt instead
  deliveryStatus?: DeliveryStatus; // Message delivery status
  metadata?: Record<string, any>; // Additional message-specific data
  replyTo?: string; // ID of message being replied to (for threading)
  editedAt?: Date; // Timestamp of last edit
  deletedAt?: Date; // Soft delete timestamp
}

/**
 * Validation function for Message entity
 */
export function validateMessage(data: Partial<Message>): string[] {
  const errors: string[] = [];

  if (!data.conversationId || data.conversationId.trim().length === 0) {
    errors.push('Conversation ID is required');
  }

  if (!data.sender) {
    errors.push('Sender is required');
  }

  const validSenders: MessageSender[] = ["customer", "agent", "system"];
  if (data.sender && !validSenders.includes(data.sender)) {
    errors.push(`Invalid sender. Must be one of: ${validSenders.join(", ")}`);
  }

  // Content is required unless there are attachments
  if (!data.content || data.content.trim().length === 0) {
    if (!data.attachments || data.attachments.length === 0) {
      errors.push('Message must have either content or attachments');
    }
  }

  if (data.content && data.content.length > 10000) {
    errors.push('Message content exceeds maximum length of 10000 characters');
  }

  if (!data.sentAt) {
    errors.push('Sent date is required');
  }

  if (data.deliveryStatus) {
    const validStatuses: DeliveryStatus[] = ["sent", "delivered", "failed", "pending"];
    if (!validStatuses.includes(data.deliveryStatus)) {
      errors.push(`Invalid delivery status. Must be one of: ${validStatuses.join(", ")}`);
    }
  }

  // Validate timestamp order
  if (data.sentAt && data.deliveredAt) {
    if (new Date(data.deliveredAt) < new Date(data.sentAt)) {
      errors.push('Delivered date cannot be before sent date');
    }
  }

  if (data.deliveredAt && data.readAt) {
    if (new Date(data.readAt) < new Date(data.deliveredAt)) {
      errors.push('Read date cannot be before delivered date');
    }
  }

  if (data.sentAt && data.editedAt) {
    if (new Date(data.editedAt) < new Date(data.sentAt)) {
      errors.push('Edited date cannot be before sent date');
    }
  }

  if (data.attachments) {
    data.attachments.forEach((attachment, index) => {
      const validTypes = ["image", "file", "video", "audio"];
      if (!validTypes.includes(attachment.type)) {
        errors.push(`Invalid attachment type at index ${index}. Must be one of: ${validTypes.join(", ")}`);
      }
      if (!attachment.url || attachment.url.trim().length === 0) {
        errors.push(`Attachment URL is required at index ${index}`);
      }
      if (attachment.size && attachment.size < 0) {
        errors.push(`Invalid attachment size at index ${index}`);
      }
    });
  }

  return errors;
}
