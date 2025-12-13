import type { Post, Platform, PostStatus, PlatformMetadata, PostMedia } from "@/core/domain/marketing/post"
import type { PostRepo, PostPayload } from "@/core/application/interfaces/marketing/post-repo"
import type { PostingAdapterFactory } from "@/core/application/interfaces/marketing/posting-adapter"
import type { QueueService } from "@/core/application/interfaces/shared/queue-service"

export interface UpdatePostResponse {
  post: Post | null;
  platformUpdated?: boolean;
  error?: string;
}

export class UpdatePostUseCase {
  constructor(
    private readonly postRepo: PostRepo,
    private readonly platformFactory: PostingAdapterFactory,
    private readonly queueService: QueueService
  ) { }

  async execute(request: PostPayload): Promise<UpdatePostResponse> {
    if (!request.id) {
      return { post: null, error: "Post ID is required" };
    }
    // 1️⃣ Lấy post hiện tại để kiểm tra trạng thái scheduling
    const existingPost = await this.postRepo.getById(request.id);
    if (!existingPost) {
      return { post: null, error: "Post not found" };
    }

    // 2️⃣ Xử lý cập nhật scheduled job nếu có thay đổi scheduleAt
    let platforms = existingPost.platforms;
    const hasScheduleChange = request.scheduledAt !== undefined &&
      request.scheduledAt !== existingPost.scheduledAt;

    if (hasScheduleChange) {
      console.log(`[UpdatePostUseCase] Schedule changed from ${existingPost.scheduledAt} to ${request.scheduledAt}`);
      const currentJobId =
        existingPost.platforms.find(p => p.scheduledJobId)?.scheduledJobId
      if (currentJobId) {
        await this.queueService.removeJob("scheduled-posts", currentJobId)
      }

      // Nếu có scheduleAt mới và là trong tương lai, tạo job mới
      if (request.scheduledAt && new Date(request.scheduledAt) > new Date()) {
        const delay = new Date(request.scheduledAt).getTime() - Date.now();
        const newJobId = await this.queueService.addJob(
          "scheduled-posts",
          "publish-scheduled-post",
          { postId: existingPost.id },
          { delay }
        )
        platforms = existingPost.platforms.map(p => ({
          ...p,
          status: "scheduled",
          scheduledJobId: newJobId,
        }))
        console.log(`[UpdatePostUseCase] ✓ Created new job ${newJobId} with delay ${delay}ms`);
      } else {
        platforms = existingPost.platforms.map(p => ({
          ...p,
          status: "draft",
          scheduledJobId: undefined,
        }))
      }
    }

    // 3️⃣ Update trong database với platforms đã được cập nhật
    const updatedPost = await this.postRepo.update({
      id: existingPost.id,
      title: request.title ?? existingPost.title,
      body: request.body ?? existingPost.body,
      media: request.media ?? existingPost.media,
      hashtags: request.hashtags ?? existingPost.hashtags,
      mentions: request.mentions ?? existingPost.mentions,
      scheduledAt: request.scheduledAt ?? existingPost.scheduledAt,
      platforms,
    })

    if (!updatedPost) {
      return { post: null, error: "Post not found or update failed" };
    }

    // --------------------------------------------------
    // 3️⃣ OPTIONAL: SYNC UPDATE TO PLATFORM
    // --------------------------------------------------

    const syncPlan = buildPlatformSyncPlan(existingPost, updatedPost)


    if (!syncPlan.payload || syncPlan.platforms.length === 0) {
      return {
        post: updatedPost,
        platformUpdated: false,
      }
    }

    let updated = false
    let lastError: string | undefined

    for (const platformMeta of syncPlan.platforms) {
      try {
        if (!updatedPost.userId) {
          throw new Error("User ID is required for platform update");
        }
        const service = await this.platformFactory.create(
          platformMeta.platform,
          updatedPost.userId
        )

        const result = await service.update(
          platformMeta.postId!,
          {
            title: syncPlan.payload.title ?? '',
            body: syncPlan.payload.body,
            media: syncPlan.payload.media,
            hashtags: syncPlan.payload.hashtags ?? [],
            mentions: syncPlan.payload.mentions ?? []
          }
        )

        updated = updated || result.success
        platformMeta.error = result.success ? undefined : result.error
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Platform update failed"
        platformMeta.error = lastError
      }
    }

    const persisted = await this.postRepo.update({
      id: updatedPost.id,
      platforms: updatedPost.platforms,
    })

    return {
      post: persisted ?? updatedPost,
      platformUpdated: updated,
      error: lastError,
    }


  }
}

interface PlatformSyncPlan {
  platforms: PlatformMetadata[]
  payload: {
    title?: string
    body?: string
    media?: PostMedia
    hashtags?: string[]
    mentions?: string[]
  } | null
}

function buildPlatformSyncPlan(
  before: Post,
  after: Post
): PlatformSyncPlan {
  const payload: PlatformSyncPlan["payload"] = {}

  if (before.title !== after.title) payload.title = after.title
  if (before.body !== after.body) payload.body = after.body

  if (JSON.stringify(before.media) !== JSON.stringify(after.media)) {
    payload.media = after.media
  }

  if (JSON.stringify(before.hashtags) !== JSON.stringify(after.hashtags)) {
    payload.hashtags = after.hashtags
  }

  if (JSON.stringify(before.mentions) !== JSON.stringify(after.mentions)) {
    payload.mentions = after.mentions
  }

  const hasChanges = Object.keys(payload).length > 0

  if (!hasChanges) {
    return { platforms: [], payload: null }
  }

  const platforms = after.platforms.filter(
    p => p.status === "published" && !!p.postId
  )

  return { platforms, payload }
}

