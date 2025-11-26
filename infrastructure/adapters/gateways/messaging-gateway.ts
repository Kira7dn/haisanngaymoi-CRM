import type { Message } from "@/core/domain/messaging/message";

/**
 * MessagingGateway Interface
 *
 * Defines the contract for platform-specific messaging implementations.
 * Each platform (Facebook, Zalo, TikTok) will implement this interface
 * to handle sending messages and fetching message history.
 */
export interface MessagingGateway {
  /**
   * Send a text message to a user on the platform
   *
   * @param platformUserId - The platform-specific user ID (PSID, Zalo User ID, TikTok Open ID)
   * @param content - The message text to send
   * @returns Promise that resolves when message is sent
   */
  sendMessage(platformUserId: string, content: string): Promise<void>;

  /**
   * Send a message with attachments to a user on the platform
   *
   * @param platformUserId - The platform-specific user ID
   * @param content - The message text (can be empty for media-only messages)
   * @param attachments - Array of attachment objects
   * @returns Promise that resolves when message is sent
   */
  sendMessageWithAttachments?(
    platformUserId: string,
    content: string,
    attachments: Array<{
      type: "image" | "file" | "video" | "audio";
      url: string;
    }>
  ): Promise<void>;

  /**
   * Fetch message history for a user (optional, platform-dependent)
   *
   * @param platformUserId - The platform-specific user ID
   * @param limit - Maximum number of messages to fetch
   * @returns Promise that resolves with array of messages
   */
  fetchHistory?(platformUserId: string, limit?: number): Promise<Message[]>;
}

/**
 * Base class for MessagingGateway implementations
 * Provides common functionality and error handling
 */
export abstract class BaseMessagingGateway implements MessagingGateway {
  abstract sendMessage(platformUserId: string, content: string): Promise<void>;

  /**
   * Log gateway activity
   */
  protected log(message: string, data?: any): void {
    const gatewayName = this.constructor.name;
    console.log(`[${gatewayName}] ${message}`, data || "");
  }

  /**
   * Log gateway errors
   */
  protected logError(message: string, error: any): void {
    const gatewayName = this.constructor.name;
    console.error(`[${gatewayName}] ${message}`, {
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Validate required parameters
   */
  protected validateParams(params: Record<string, any>): void {
    for (const [key, value] of Object.entries(params)) {
      if (!value || (typeof value === "string" && value.trim().length === 0)) {
        throw new Error(`${key} is required`);
      }
    }
  }
}
