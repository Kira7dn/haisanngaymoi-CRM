import { GeneratePostContentUseCase } from "@/core/application/usecases/marketing/post/generate-post-content"
import { GeneratePostMultiPassUseCase } from "@/core/application/usecases/marketing/post/generate-post-multi-pass"

export const createGeneratePostContentUseCase = async () => {
  return new GeneratePostContentUseCase()
}

export const createGeneratePostMultiPassUseCase = async () => {
  return new GeneratePostMultiPassUseCase()
}
