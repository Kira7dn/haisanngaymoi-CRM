import type { Post } from "@/core/domain/post"
import { postRepository } from "@/infrastructure/repositories/post-repo"

export async function updatePostUseCase(id: string, data: Partial<Post>) {
  return postRepository.update(id, data)
}
