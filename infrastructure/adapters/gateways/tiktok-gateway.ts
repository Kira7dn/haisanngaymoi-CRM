import { BaseMessagingGateway } from "./messaging-gateway";
import type { Message } from "@/core/domain/messaging/message";

/**
 * TikTokGateway
 *
 * Implements MessagingGateway for TikTok Business Messaging
 *
 * Reference: https://developers.tiktok.com/doc/messaging-api-overview
 */
export class TikTokGateway extends BaseMessagingGateway {
  private readonly accessToken: string;
  private readonly baseUrl: string = "https://business-api.tiktok.com/open_api/v1.3";

  constructor() {
    super();
    this.accessToken = process.env.TIKTOK_ACCESS_TOKEN || "";

    if (!this.accessToken) {
      console.warn("[TikTokGateway] TIKTOK_ACCESS_TOKEN not configured");
    }
  }

  /**
   * Send a text message to a user via TikTok Business Messaging
   */
  async sendMessage(platformUserId: string, content: string): Promise<void> {
    this.validateParams({ platformUserId, content });

    const payload = {
      sender_id: platformUserId,
      message: {
        text: content,
      },
    };

    await this.sendToTikTok("/message/send/", payload);
  }

  /**
   * Send a message with attachments to a user
   */
  async sendMessageWithAttachments(
    platformUserId: string,
    content: string,
    attachments: Array<{
      type: "image" | "file" | "video" | "audio";
      url: string;
    }>
  ): Promise<void> {
    this.validateParams({ platformUserId });

    // Send text message first if provided
    if (content && content.trim().length > 0) {
      await this.sendMessage(platformUserId, content);
    }

    // Send each attachment
    for (const attachment of attachments) {
      const payload = {
        sender_id: platformUserId,
        message: {
          attachment: {
            type: this.mapAttachmentType(attachment.type),
            payload: {
              url: attachment.url,
            },
          },
        },
      };

      await this.sendToTikTok("/message/send/", payload);
    }
  }

  /**
   * Fetch message history (if supported by TikTok API)
   */
  async fetchHistory(platformUserId: string, limit: number = 50): Promise<Message[]> {
    this.log("fetchHistory not yet implemented for TikTok", {
      platformUserId,
      limit,
    });
    throw new Error(
      "fetchHistory is not yet implemented for TikTok Business Messaging. Messages should be stored via webhooks."
    );
  }

  /**
   * Send payload to TikTok Business API
   */
  private async sendToTikTok(endpoint: string, payload: any): Promise<void> {
    try {
      this.log(`Sending request to TikTok ${endpoint}`, payload);

      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": this.accessToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.code !== 0) {
        this.logError("TikTok API error", data);
        throw new Error(`TikTok API error: ${data.message || "Unknown error"}`);
      }

      this.log("Message sent successfully", data);
    } catch (error: any) {
      this.logError("Failed to send message to TikTok", error);
      throw error;
    }
  }

  /**
   * Map our attachment type to TikTok's media type
   */
  private mapAttachmentType(type: string): string {
    switch (type) {
      case "image":
        return "image";
      case "video":
        return "video";
      case "audio":
        return "audio";
      case "file":
      default:
        return "file";
    }
  }

  /**
   * Send typing indicator to user
   */
  async sendTypingIndicator(platformUserId: string, typing: boolean): Promise<void> {
    this.validateParams({ platformUserId });

    const payload = {
      sender_id: platformUserId,
      sender_action: typing ? "typing_on" : "typing_off",
    };

    try {
      await this.sendToTikTok("/message/typing/", payload);
    } catch (error) {
      // Typing indicators are optional, don't fail if not supported
      this.log("Typing indicator failed (optional feature)", { error });
    }
  }

  /**
   * Send a card message (product card, etc.)
   */
  async sendCard(
    platformUserId: string,
    card: {
      title: string;
      subtitle?: string;
      image_url?: string;
      buttons?: Array<{
        type: "web_url" | "postback";
        title: string;
        url?: string;
        payload?: string;
      }>;
    }
  ): Promise<void> {
    this.validateParams({ platformUserId });

    const payload = {
      sender_id: platformUserId,
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: card.title,
                subtitle: card.subtitle,
                image_url: card.image_url,
                buttons: card.buttons,
              },
            ],
          },
        },
      },
    };

    await this.sendToTikTok("/message/send/", payload);
  }

  /**
   * Get conversation details
   */
  async getConversation(conversationId: string): Promise<any> {
    this.validateParams({ conversationId });

    try {
      const url = `${this.baseUrl}/conversation/get/?conversation_id=${conversationId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Access-Token": this.accessToken,
        },
      });

      const data = await response.json();

      if (!response.ok || data.code !== 0) {
        this.logError("TikTok API error getting conversation", data);
        throw new Error(`TikTok API error: ${data.message || "Unknown error"}`);
      }

      return data.data;
    } catch (error: any) {
      this.logError("Failed to get conversation from TikTok", error);
      throw error;
    }
  }
}
