import { PostRepo } from "@/core/application/interfaces/marketing/post-repo"
import { PostingAdapterFactory } from "@/infrastructure/adapters/external/social"
import { PostStatus } from "@/core/domain/marketing/post"

export class PublishPostUseCase {
  constructor(
    private readonly postRepo: PostRepo,
    private readonly platformFactory: PostingAdapterFactory
  ) { }

  async execute(postId: string, userId: string) {
    const post = await this.postRepo.getById(postId)
    if (!post) throw new Error("Post not found")

    const results = []
    const updatedPlatforms = []

    for (const p of post.platforms) {
      // ✅ Idempotency
      if (p.status === "published") continue

      try {
        const adapter = await this.platformFactory.create(p.platform, userId)

        const result = await adapter.publish({
          title: post.title ?? "",
          body: post.body,
          media: Array.isArray(post.media) ? post.media[0] : post.media,
          hashtags: post.hashtags ?? [],
          mentions: post.mentions ?? [],
        })

        updatedPlatforms.push({
          platform: p.platform,
          status: (result.success ? "published" : "failed") as PostStatus,
          postId: result.postId,
          permalink: result.permalink,
          publishedAt: result.success ? new Date() : undefined,
          error: result.error,
        })

        results.push({ platform: p.platform, ...result })
      } catch (e) {
        updatedPlatforms.push({
          platform: p.platform,
          status: "failed" as PostStatus,
          error: e instanceof Error ? e.message : "Unknown error",
        })
      }
    }

    await this.postRepo.update({
      id: postId,
      platforms: updatedPlatforms,
    })

    return results
  }
}
