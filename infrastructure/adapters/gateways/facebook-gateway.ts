import { BaseMessagingGateway } from "./messaging-gateway";
import type { Message } from "@/core/domain/messaging/message";

/**
 * FacebookGateway
 *
 * Implements MessagingGateway for Facebook Messenger Platform
 *
 * Reference: https://developers.facebook.com/docs/messenger-platform/reference/send-api
 */
export class FacebookGateway extends BaseMessagingGateway {
  private readonly pageAccessToken: string;
  private readonly apiVersion: string = "v18.0";
  private readonly baseUrl: string;

  constructor() {
    super();
    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

    if (!this.pageAccessToken) {
      console.warn("[FacebookGateway] FACEBOOK_PAGE_ACCESS_TOKEN not configured");
    }
  }

  /**
   * Send a text message to a user via Facebook Messenger
   */
  async sendMessage(platformUserId: string, content: string): Promise<void> {
    this.validateParams({ platformUserId, content });

    const payload = {
      recipient: {
        id: platformUserId,
      },
      message: {
        text: content,
      },
    };

    await this.sendToFacebook(payload);
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

    // Facebook requires separate API calls for text and attachments
    // Send text first if provided
    if (content && content.trim().length > 0) {
      await this.sendMessage(platformUserId, content);
    }

    // Send each attachment separately
    for (const attachment of attachments) {
      const payload = {
        recipient: {
          id: platformUserId,
        },
        message: {
          attachment: {
            type: this.mapAttachmentType(attachment.type),
            payload: {
              url: attachment.url,
              is_reusable: true,
            },
          },
        },
      };

      await this.sendToFacebook(payload);
    }
  }

  /**
   * Fetch message history (not directly supported by Facebook API)
   * Facebook doesn't provide a direct API to fetch user message history
   * You would need to store messages as they come through webhooks
   */
  async fetchHistory(platformUserId: string, limit: number = 50): Promise<Message[]> {
    this.log("fetchHistory not supported by Facebook Messenger Platform", {
      platformUserId,
      limit,
    });
    throw new Error(
      "fetchHistory is not supported by Facebook Messenger Platform. Messages should be stored via webhooks."
    );
  }

  /**
   * Send payload to Facebook Send API
   */
  private async sendToFacebook(payload: any): Promise<void> {
    try {
      this.log("Sending message to Facebook", payload);

      const url = `${this.baseUrl}/me/messages?access_token=${this.pageAccessToken}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logError("Facebook API error", data);
        throw new Error(
          `Facebook API error: ${data.error?.message || "Unknown error"}`
        );
      }

      this.log("Message sent successfully", data);
    } catch (error: any) {
      this.logError("Failed to send message to Facebook", error);
      throw error;
    }
  }

  /**
   * Map our attachment type to Facebook's attachment type
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
      recipient: {
        id: platformUserId,
      },
      sender_action: typing ? "typing_on" : "typing_off",
    };

    await this.sendToFacebook(payload);
  }

  /**
   * Mark message as read
   */
  async markAsRead(platformUserId: string): Promise<void> {
    this.validateParams({ platformUserId });

    const payload = {
      recipient: {
        id: platformUserId,
      },
      sender_action: "mark_seen",
    };

    await this.sendToFacebook(payload);
  }
}
