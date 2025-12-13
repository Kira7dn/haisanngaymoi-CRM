import type { SocialAuthRepo } from "@/core/application/interfaces/social/social-auth-repo";
import { ObjectId } from "mongodb";
import { Platform } from "@/core/domain/marketing/post";
import { OAuthAdapterResolver } from "../../interfaces/social/platform-oauth-adapter";

export interface RevokeSocialAccountRequest {
    userId: ObjectId;
    platform: Platform;
}

export interface RevokeSocialAccountResponse {
    success: boolean;
    message?: string;
}

export class RevokeSocialAccountUseCase {

    constructor(
        private resolver: OAuthAdapterResolver,
        private repo: SocialAuthRepo
    ) { }

    async execute(
        request: RevokeSocialAccountRequest
    ): Promise<RevokeSocialAccountResponse> {
        const { userId, platform } = request;

        const auth = await this.repo.getByUserAndPlatform(
            userId,
            platform
        );

        if (!auth) {
            return {
                success: false,
                message: `${platform} account not connected`,
            };
        }

        try {
            // 1. Resolve platform OAuth adapter (stateless)
            const adapter = await this.resolver.getAdapter(platform);

            // 2. Revoke token (optional per platform)
            if (adapter.revokeToken) {
                try {
                    await adapter.revokeToken(auth.accessToken, auth.refreshToken || "");
                } catch (err) {
                    console.warn(`Failed to revoke token for ${platform}`, err);
                    // Không throw — vẫn tiếp tục xóa DB
                }
            }

            // 3. Remove DB record
            await this.repo.deleteByUserAndPlatform(userId, platform);

            return { success: true };
        } catch (err) {
            return {
                success: false,
                message: err instanceof Error ? err.message : `Failed to revoke ${platform}`,
            };
        }
    }
}
