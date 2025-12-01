import type { SendMessageResult } from "@/core/application/interfaces/social/messaging-adapter";
import type { ZaloAuthService } from "../auth/zalo-auth-service";
import { BaseMessagingAdapter } from "./messaging-service";

export class ZaloMessagingAdapter extends BaseMessagingAdapter {
  platform = "zalo" as const;

  constructor(private auth: ZaloAuthService) {
    super();
  }

  async getCustomerInfo(platformUserId: string): Promise<{ name: string; avatar: string }> {
    this.validateParams({ platformUserId });

    try {
      this.log("Getting customer info from Zalo", platformUserId);

      const accessToken = this.auth.getAccessToken();
      if (!accessToken) {
        throw new Error("No Zalo access token available");
      }

      const url = `https://openapi.zalo.me/v2.0/oa/getprofile?data={"user_id":"${platformUserId}"}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          access_token: accessToken,
        },
      });

      const result = await response.json();

      if (!response.ok || result.error !== 0) {
        this.logError("Zalo API error", result);
        throw new Error(`Zalo API error: ${result.message || "Unknown error"}`);
      }

      this.log("Customer info retrieved successfully", result.data);

      return {
        name: result.data.display_name || result.data.user_id,
        avatar: result.data.avatar || "",
      };
    } catch (error: any) {
      this.logError("Failed to get customer info from Zalo", error);
      throw error;
    }
  }

  async sendMessage(platformUserId: string, content: string): Promise<SendMessageResult> {
    // TODO: Implement Zalo messaging
    throw new Error("Zalo messaging not yet implemented");
  }
}
