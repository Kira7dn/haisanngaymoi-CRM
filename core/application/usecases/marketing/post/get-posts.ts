import type { Post } from "@/core/domain/marketing/post"
import type { PostRepo } from "@/core/application/interfaces/marketing/post-repo"

export interface GetPostsResponse {
  posts: Post[]
}

export class GetPostsUseCase {
  constructor(private postRepo: PostRepo) { }

  async execute(): Promise<GetPostsResponse> {
    const posts = await this.postRepo.getAll()
    return { posts }
  }
}
