import type { SocialAuthService } from "@/core/application/interfaces/social/social-auth-service"
import type { PlatformConfig } from "@/core/domain/social/social-auth"
import { ObjectId } from "mongodb"

export interface UpdatePlatformConfigRequest {
  connectionId: string
  platformConfig: PlatformConfig
}

export interface UpdatePlatformConfigResponse {
  success: boolean
  message?: string
}

export class UpdatePlatformConfigUseCase {
  constructor(private socialAuthService: SocialAuthService) {}

  async execute(
    request: UpdatePlatformConfigRequest
  ): Promise<UpdatePlatformConfigResponse> {
    try {
      const { connectionId, platformConfig } = request

      // Validate connectionId
      if (!ObjectId.isValid(connectionId)) {
        return {
          success: false,
          message: "Invalid connection ID",
        }
      }

      // Update the social auth record
      const updated = await this.socialAuthService.update({
        id: new ObjectId(connectionId),
        platformConfig,
      })

      if (!updated) {
        return {
          success: false,
          message: "Connection not found",
        }
      }

      return {
        success: true,
        message: "Platform configuration updated successfully",
      }
    } catch (error) {
      console.error("UpdatePlatformConfigUseCase error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
