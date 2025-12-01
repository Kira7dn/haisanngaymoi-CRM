import { SocialAuthRepository } from "@/infrastructure/repositories/social/social-auth-repo"
import { UpdatePlatformConfigUseCase } from "@/core/application/usecases/social/update-platform-config"

export const createUpdatePlatformConfigUseCase = async () => {
  const socialAuthService = new SocialAuthRepository()
  return new UpdatePlatformConfigUseCase(socialAuthService)
}
