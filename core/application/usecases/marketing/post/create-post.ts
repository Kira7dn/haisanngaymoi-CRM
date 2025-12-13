import type { Post, Platform, PlatformMetadata } from "@/core/domain/marketing/post"
import type { PostRepo, PostPayload } from "@/core/application/interfaces/marketing/post-repo"
import type { PostingAdapterFactory } from "@/core/application/interfaces/marketing/posting-adapter"
import type { QueueService } from "@/core/application/interfaces/shared/queue-service"

export interface PlatformPublishResult {
  platform: Platform
  success: boolean
  status: "scheduled" | "published" | "failed"
  postId?: string
  permalink?: string
  error?: string
}

export interface CreatePostResponse {
  post: Post
  platformResults: PlatformPublishResult[]
}

export class CreatePostUseCase {
  constructor(
    private readonly postRepo: PostRepo,
    private readonly platformFactory: PostingAdapterFactory,
    private readonly queueService: QueueService
  ) { }

  async execute(request: PostPayload): Promise<CreatePostResponse> {
    if (!request.platforms || request.platforms.length === 0) {
      // Draft only
      const post = await this.postRepo.create({
        ...request,
        platforms: [],
      })

      return { post, platformResults: [] }
    }

    const isScheduled =
      !!request.scheduledAt && new Date(request.scheduledAt) > new Date()

    // 1️⃣ Build initial platform metadata (SINGLE CREATE)
    const initialPlatforms: PlatformMetadata[] = request.platforms.map(p => ({
      platform: p.platform,
      status: isScheduled ? "scheduled" : "draft",
    }))

    const post = await this.postRepo.create({
      ...request,
      media: request.media,
      platforms: initialPlatforms,
    })

    // 2️⃣ Scheduled post → enqueue & return
    if (isScheduled) {
      const delay = new Date(request.scheduledAt!).getTime() - Date.now()

      const jobId = await this.queueService.addJob(
        "scheduled-posts",
        "publish-scheduled-post",
        {
          postId: post.id,
          userId: request.userId,
          platforms: request.platforms,
        },
        { delay }
      )

      const updatedPost = await this.postRepo.update({
        id: post.id,
        platforms: initialPlatforms.map(p => ({
          ...p,
          scheduledJobId: jobId,
        })),
      })

      return {
        post: updatedPost || post,
        platformResults: request.platforms.map(p => ({
          platform: p.platform,
          success: true,
          status: "scheduled",
        })),
      }
    }

    // 3️⃣ Publish immediately
    if (!request.userId) {
      throw new Error("userId is required for publishing")
    }

    const platformResults: PlatformPublishResult[] = []
    const updatedPlatforms: PlatformMetadata[] = []

    for (const platform of request.platforms) {
      try {
        const service = await this.platformFactory.create(
          platform.platform,
          request.userId
        )

        const result = await service.publish({
          title: request.title ?? "",
          body: request.body,
          media: request.media,
          hashtags: request.hashtags ?? [],
          mentions: request.mentions ?? [],
        })

        platformResults.push({
          platform: platform.platform,
          success: result.success,
          status: result.success ? "published" : "failed",
          postId: result.postId,
          permalink: result.permalink,
          error: result.error,
        })

        updatedPlatforms.push({
          platform: platform.platform,
          status: result.success ? "published" : "failed",
          postId: result.postId,
          permalink: result.permalink,
          publishedAt: result.success ? new Date() : undefined,
          error: result.success ? undefined : result.error,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"

        platformResults.push({
          platform: platform.platform,
          success: false,
          status: "failed",
          error: message,
        })

        updatedPlatforms.push({
          platform: platform.platform,
          status: "failed",
          error: message,
        })
      }
    }

    const updatedPost = await this.postRepo.update({
      id: post.id,
      platforms: updatedPlatforms,
    })

    return {
      post: updatedPost || post,
      platformResults,
    }
  }
}
