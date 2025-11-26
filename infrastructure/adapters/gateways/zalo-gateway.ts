import { BaseMessagingGateway } from "./messaging-gateway";
import type { Message } from "@/core/domain/messaging/message";

/**
 * ZaloGateway
 *
 * Implements MessagingGateway for Zalo Official Account (OA)
 *
 * Reference: https://developers.zalo.me/docs/official-account/api/gui-tin-nhan-post-5022
 */
export class ZaloGateway extends BaseMessagingGateway {
  private readonly accessToken: string;
  private readonly baseUrl: string = "https://openapi.zalo.me/v3.0/oa";

  constructor() {
    super();
    this.accessToken = process.env.ZALO_OA_ACCESS_TOKEN || "";

    if (!this.accessToken) {
      console.warn("[ZaloGateway] ZALO_OA_ACCESS_TOKEN not configured");
    }
  }

  /**
   * Send a text message to a user via Zalo OA
   */
  async sendMessage(platformUserId: string, content: string): Promise<void> {
    this.validateParams({ platformUserId, content });

    const payload = {
      recipient: {
        user_id: platformUserId,
      },
      message: {
        text: content,
      },
    };

    await this.sendToZalo("/message", payload);
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

    // Send attachments based on type
    for (const attachment of attachments) {
      let payload: any;

      switch (attachment.type) {
        case "image":
          payload = {
            recipient: {
              user_id: platformUserId,
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "media",
                  elements: [
                    {
                      media_type: "image",
                      url: attachment.url,
                    },
                  ],
                },
              },
            },
          };
          break;

        case "file":
          payload = {
            recipient: {
              user_id: platformUserId,
            },
            message: {
              attachment: {
                type: "file",
                payload: {
                  url: attachment.url,
                },
              },
            },
          };
          break;

        default:
          // For unsupported types, send as text message
          await this.sendMessage(
            platformUserId,
            content || `[${attachment.type}]: ${attachment.url}`
          );
          continue;
      }

      await this.sendToZalo("/message", payload);
    }

    // Send text message if provided and not sent yet
    if (content && content.trim().length > 0) {
      await this.sendMessage(platformUserId, content);
    }
  }

  /**
   * Fetch message history (not directly supported by Zalo OA API)
   */
  async fetchHistory(platformUserId: string, limit: number = 50): Promise<Message[]> {
    this.log("fetchHistory not supported by Zalo OA API", {
      platformUserId,
      limit,
    });
    throw new Error(
      "fetchHistory is not supported by Zalo OA API. Messages should be stored via webhooks."
    );
  }

  /**
   * Send payload to Zalo OA API
   */
  private async sendToZalo(endpoint: string, payload: any): Promise<void> {
    try {
      this.log(`Sending request to Zalo ${endpoint}`, payload);

      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: this.accessToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error !== 0) {
        this.logError("Zalo API error", data);
        throw new Error(`Zalo API error: ${data.message || "Unknown error"}`);
      }

      this.log("Message sent successfully", data);
    } catch (error: any) {
      this.logError("Failed to send message to Zalo", error);
      throw error;
    }
  }

  /**
   * Send typing indicator to user (if supported)
   */
  async sendTypingIndicator(platformUserId: string, typing: boolean): Promise<void> {
    // Zalo OA doesn't support typing indicators in the current API version
    this.log("Typing indicators not supported by Zalo OA", {
      platformUserId,
      typing,
    });
  }

  /**
   * Send a quick reply message
   */
  async sendQuickReply(
    platformUserId: string,
    content: string,
    quickReplies: Array<{
      title: string;
      payload: string;
      image_icon?: string;
    }>
  ): Promise<void> {
    this.validateParams({ platformUserId, content });

    const payload = {
      recipient: {
        user_id: platformUserId,
      },
      message: {
        text: content,
        quick_replies: quickReplies.map((qr) => ({
          content_type: "text",
          title: qr.title,
          payload: qr.payload,
          image_icon: qr.image_icon,
        })),
      },
    };

    await this.sendToZalo("/message", payload);
  }

  /**
   * Get user profile information
   */
  async getUserProfile(platformUserId: string): Promise<any> {
    this.validateParams({ platformUserId });

    try {
      const url = `${this.baseUrl}/getprofile?data={"user_id":"${platformUserId}"}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          access_token: this.accessToken,
        },
      });

      const data = await response.json();

      if (!response.ok || data.error !== 0) {
        this.logError("Zalo API error getting user profile", data);
        throw new Error(`Zalo API error: ${data.message || "Unknown error"}`);
      }

      return data.data;
    } catch (error: any) {
      this.logError("Failed to get user profile from Zalo", error);
      throw error;
    }
  }
}
