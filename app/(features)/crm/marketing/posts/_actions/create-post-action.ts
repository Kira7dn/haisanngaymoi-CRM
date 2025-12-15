"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { parseDateTimeLocal } from "@/lib/date-utils"

import { createPostUseCase } from "@/app/api/posts/depends"
import { createStoreContentEmbeddingUseCase } from "@/app/api/content-memory/depends"

import type { ContentType, PostMedia, Platform, PostStatus } from "@/core/domain/marketing/post"

// ==============================
// DTO
// ==============================
export interface CreatePostPayload {
  title: string
  body: string
  contentType: ContentType

  platforms: Platform[]
  media?: PostMedia
  hashtags: string[]
  scheduledAt?: string // ISO | datetime-local
}

export type PostSubmitMode = "draft" | "schedule" | "publish"

export interface SubmitPostInput {
  mode: PostSubmitMode
  payload: CreatePostPayload
}

// ==============================
// Server Action
// ==============================
export async function createPostAction(input: SubmitPostInput) {
  const { mode, payload } = input

  // ---------- Auth ----------
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get("admin_user_id")
  if (!userIdCookie) {
    throw new Error("Unauthorized")
  }

  const userId = userIdCookie.value

  // ---------- Validation ----------
  if (mode !== "draft" && payload.platforms.length === 0) {
    throw new Error("At least one platform is required")
  }

  if (!payload.title && !payload.body) {
    throw new Error("Post content is empty")
  }

  // ---------- Parse schedule ----------
  const scheduledAt =
    mode === "schedule" && payload.scheduledAt
      ? parseDateTimeLocal(payload.scheduledAt)
      : undefined

  // ---------- UseCase ----------
  const useCase = await createPostUseCase()

  const post = await useCase.execute({
    userId,
    title: payload.title,
    body: payload.body,
    contentType: payload.contentType,
    platforms: payload.platforms.map(platform => ({
      platform,
      status: (mode === "draft" ? "draft" : mode === "schedule" ? "scheduled" : "published") as PostStatus
    })),
    media: payload.media,
    hashtags: payload.hashtags,
    scheduledAt,
  })

  // ---------- Store Embedding (side-effect) ----------
  // Chỉ lưu embedding cho publish / schedule (không phải draft)
  if (mode !== "draft" && post.body) {
    const primaryPlatform = payload.platforms[0]

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
        // Không fail toàn bộ flow
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
