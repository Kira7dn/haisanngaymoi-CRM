import type { Platform } from "@/core/domain/messaging/message";
import type { MessagingGateway } from "./messaging-gateway";
import { FacebookGateway } from "./facebook-gateway";
import { ZaloGateway } from "./zalo-gateway";
import { TikTokGateway } from "./tiktok-gateway";

/**
 * MessagingGatewayFactory
 *
 * Factory pattern to create the correct MessagingGateway implementation
 * based on the platform type.
 *
 * Usage:
 * ```typescript
 * const gateway = MessagingGatewayFactory.create("facebook");
 * await gateway.sendMessage(userId, "Hello!");
 * ```
 */
export class MessagingGatewayFactory {
  /**
   * Create a MessagingGateway instance for the specified platform
   *
   * @param platform - The messaging platform (facebook, zalo, tiktok, website)
   * @returns MessagingGateway implementation for the platform
   * @throws Error if platform is not supported
   */
  static create(platform: Platform): MessagingGateway {
    switch (platform) {
      case "facebook":
        return new FacebookGateway();

      case "zalo":
        return new ZaloGateway();

      case "tiktok":
        return new TikTokGateway();

      case "website":
        // Website messaging can be handled differently
        // For now, throw an error or implement a WebsiteGateway
        throw new Error(
          "Website messaging gateway not yet implemented. Website messages are typically handled via websockets or in-app chat."
        );

      default:
        throw new Error(`Unsupported messaging platform: ${platform}`);
    }
  }

  /**
   * Check if a platform is supported
   *
   * @param platform - The platform to check
   * @returns true if platform is supported, false otherwise
   */
  static isSupported(platform: Platform): boolean {
    return ["facebook", "zalo", "tiktok"].includes(platform);
  }

  /**
   * Get list of supported platforms
   *
   * @returns Array of supported platform names
   */
  static getSupportedPlatforms(): Platform[] {
    return ["facebook", "zalo", "tiktok"];
  }
}
