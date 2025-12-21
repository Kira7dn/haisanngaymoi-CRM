import type { Post } from "@/core/domain/marketing/post"
import type { PostRepo, DateRangeFilter } from "@/core/application/interfaces/marketing/post-repo"
import type { PaginationOptions } from "@/infrastructure/db/base-repository"

export interface GetPostsRequest {
  usePagination?: boolean
  pagination?: PaginationOptions
  dateRange?: DateRangeFilter
}

export interface GetPostsResponse {
  posts: Post[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export class GetPostsUseCase {
  constructor(private postRepo: PostRepo) { }

  async execute(request: GetPostsRequest = {}): Promise<GetPostsResponse> {
    const { usePagination = false, pagination, dateRange } = request

    // If date range is provided, use it
    if (dateRange) {
      const posts = await this.postRepo.getByDateRange(dateRange)
      return { posts }
    }

    // If pagination is requested
    if (usePagination) {
      const result = await this.postRepo.getAllPaginated(pagination)
      return {
        posts: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      }
    }

    // Default: load all posts (backward compatibility)
    const posts = await this.postRepo.getAll()
    return { posts }
  }
}
