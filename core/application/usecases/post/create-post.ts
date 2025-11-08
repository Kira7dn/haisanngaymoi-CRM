import type { Post } from "@/core/domain/post"
import { postRepository } from "@/infrastructure/repositories/post-repo"

export async function createPostUseCase(data: Omit<Post, "id">) {
  return postRepository.create(data)
}
