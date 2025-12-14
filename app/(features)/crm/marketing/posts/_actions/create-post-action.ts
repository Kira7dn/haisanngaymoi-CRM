"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { parseDateTimeLocal } from "@/lib/date-utils"
import { createPostUseCase } from "@/app/api/posts/depends"
import { createStoreContentEmbeddingUseCase } from "@/app/api/content-memory/depends"
import type { ContentType, PostMedia, Platform, PlatformMetadata } from "@/core/domain/marketing/post"


// core/application/dtos/create-post.dto.ts
export interface CreatePostPayload {
    title: string
    body: string
    contentType: ContentType

    platforms: Platform[]
    media?: PostMedia
    hashtags: string[]
    scheduledAt?: string // ISO or datetime-local
}

export type PostSubmitMode = "draft" | "schedule" | "publish"

export interface SubmitPostInput {
    mode: PostSubmitMode
    payload: CreatePostPayload
}

export async function createPostAction(input: SubmitPostInput) {
    const { mode, payload } = input

    // ---------- Auth ----------
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get("admin_user_id")
    if (!userIdCookie) {
        throw new Error("Unauthorized")
    }

    // ---------- Validation (lightweight) ----------
    if (mode !== "draft" && payload.platforms.length === 0) {
        throw new Error("At least one platform is required")
    }

    if (!payload.title && !payload.body) {
        throw new Error("Post content is empty")
    }

    // ---------- Map platform metadata ----------
    const platforms: PlatformMetadata[] = payload.platforms.map(platform => ({
        platform,
        status:
            mode === "draft"
                ? "draft"
                : mode === "schedule"
                    ? "scheduled"
                    : "published"
    }))

    // ---------- Parse schedule ----------
    const scheduledAt =
        payload.scheduledAt && mode === "schedule"
            ? parseDateTimeLocal(payload.scheduledAt)
            : undefined

    // ---------- UseCase ----------
    const useCase = await createPostUseCase()

    const result = await useCase.execute({
        userId: userIdCookie.value,
        title: payload.title,
        body: payload.body,
        contentType: payload.contentType,
        platforms,
        media: payload.media,
        hashtags: payload.hashtags,
        scheduledAt
    })

    // ---------- Store Embedding (Backend Side Effect) ----------
    // Only store for published/scheduled posts, not drafts
    if (mode !== "draft" && result.post.body) {
        const primaryPlatform = payload.platforms[0]
        if (primaryPlatform) {
            try {
                const embeddingUseCase = await createStoreContentEmbeddingUseCase()
                await embeddingUseCase.execute({
                    postId: result.post.id.toString(),
                    content: result.post.body,
                    title: result.post.title,
                    platform: primaryPlatform,
                    topic: result.post.title || undefined
                })
            } catch (error) {
                // Don't fail the whole operation if embedding fails
                console.error('[createPostAction] Failed to store embedding:', error)
            }
        }
    }

    revalidatePath("/crm/posts")

    return {
        success: true,
        postId: result.post.id.toString(),
        platformResults: result.platformResults,
    }
}