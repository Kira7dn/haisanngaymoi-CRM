import { postRepository } from "@/infrastructure/repositories/post-repo"

export async function deletePostUseCase(id: string) {
  return postRepository.delete(id)
}
