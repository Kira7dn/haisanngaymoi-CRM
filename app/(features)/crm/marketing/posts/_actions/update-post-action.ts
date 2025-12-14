"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { parseDateTimeLocal } from "@/lib/date-utils"
import { updatePostUseCase } from "@/app/api/posts/depends"
import type { ContentType, Platform, PostMedia, PlatformMetadata } from "@/core/domain/marketing/post"

export interface UpdatePostPayload {
    title?: string
    body?: string
    contentType?: ContentType

    platforms?: Platform[]
    media?: PostMedia | null
    hashtags?: string[]
    scheduledAt?: string | null
}


export type PostSubmitMode = "draft" | "schedule" | "publish"

export interface UpdatePostInput {
    postId: string
    payload: UpdatePostPayload
}


export async function updatePostAction(input: UpdatePostInput) {
    const { postId, payload } = input

    // ---------- Auth ----------
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get("admin_user_id")
    if (!userIdCookie) {
        throw new Error("Unauthorized")
    }

    // ---------- Build update data ----------
    const updateData: any = {
        id: postId,
        userId: userIdCookie.value,
        updatedAt: new Date()
    }

    if (payload.title !== undefined) {
        updateData.title = payload.title
    }

    if (payload.body !== undefined) {
        updateData.body = payload.body
    }

    if (payload.contentType !== undefined) {
        updateData.contentType = payload.contentType
    }

    if (payload.platforms !== undefined) {
        const platforms: PlatformMetadata[] = payload.platforms.map(platform => ({
            platform,
            status: "draft" // update không auto publish
        }))
        updateData.platforms = platforms
    }

    if (payload.media !== undefined) {
        updateData.media = payload.media ?? undefined
    }

    if (payload.hashtags !== undefined) {
        updateData.hashtags = payload.hashtags
    }

    if (payload.scheduledAt !== undefined) {
        updateData.scheduledAt = payload.scheduledAt
            ? parseDateTimeLocal(payload.scheduledAt)
            : undefined
    }

    // ---------- UseCase ----------
    const useCase = await updatePostUseCase()
    await useCase.execute(updateData)

    // ---------- Cache ----------
    revalidatePath("/crm/posts")

    return { success: true }
}