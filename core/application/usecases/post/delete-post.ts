import type { PostService } from "@/core/application/interfaces/post-service"

export interface DeletePostRequest {
  id: string
}

export interface DeletePostResponse {
  success: boolean
}

export class DeletePostUseCase {
  constructor(private postService: PostService) {}

  async execute(request: DeletePostRequest): Promise<DeletePostResponse> {
    const success = await this.postService.delete(request.id)
    return { success }
  }
}
