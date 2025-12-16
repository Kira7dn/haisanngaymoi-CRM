"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { createPostUseCase } from "@/app/api/posts/depends"
import { createStoreContentEmbeddingUseCase } from "@/app/api/content-memory/depends"

import type { PostStatus } from "@/core/domain/marketing/post"
import { PostPayload } from "@/core/application/interfaces/marketing/post-repo"


export interface SubmitPostInput {
  payload: PostPayload
}

export async function createPostAction(input: SubmitPostInput) {
  const { payload } = input

  // ---------- Auth ----------
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get("admin_user_id")
  if (!userIdCookie) {
    throw new Error("Unauthorized")
  }

  const userId = userIdCookie.value

  // ---------- Validation ----------
  if (payload.platforms?.length === 0) {
    throw new Error("At least one platform is required")
  }

  if (!payload.title && !payload.body) {
    throw new Error("Post content is empty")
  }

  // ---------- Parse schedule ----------
  const scheduledAt = payload.scheduledAt
    ? new Date(payload.scheduledAt)
    : undefined

  // ---------- UseCase ----------
  const useCase = await createPostUseCase()

  const post = await useCase.execute({
    userId,
    title: payload.title,
    body: payload.body,
    contentType: payload.contentType,
    platforms: payload.platforms?.map(platform => ({
      platform: platform.platform,
      status: (scheduledAt ? "scheduled" : "draft") as PostStatus
    })),
    media: payload.media,
    hashtags: payload.hashtags,
    scheduledAt,
  })

  // ---------- Store Embedding (side-effect) ----------
  if (post.body) {
    const primaryPlatform = payload.platforms?.[0]?.platform

    if (primaryPlatform) {
      try {
        const embeddingUseCase = await createStoreContentEmbeddingUseCase()

        await embeddingUseCase.execute({
          postId: post.id.toString(),
          content: post.body,
          title: post.title,
          platform: primaryPlatform,
          topic: post.title || undefined,
        })
      } catch (error) {
        console.error(
          "[createPostAction] Failed to store embedding:",
          error
        )
      }
    }
  }

  revalidatePath("/crm/posts")

  return {
    success: true,
    postId: post.id.toString(),
  }
}
