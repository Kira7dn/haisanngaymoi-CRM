"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getPostsUseCase, createPostUseCase, updatePostUseCase, deletePostUseCase } from "@/app/api/posts/depends"
import type { Platform, ContentType, PostMedia, PlatformMetadata } from "@/core/domain/marketing/post"

export async function createPostAction(formData: FormData) {
  const useCase = await createPostUseCase()

  // Get current user ID from cookies
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get("admin_user_id")
  if (!userIdCookie) {
    throw new Error("Unauthorized - Please login first")
  }

  const title = formData.get("title")?.toString() || ""
  const body = formData.get("body")?.toString() || ""
  const contentType = formData.get("contentType")?.toString() as ContentType || "post"
  const platformsJson = formData.get("platforms")?.toString() || "[]"
  const mediaJson = formData.get("media")?.toString() || "[]"
  const hashtagsStr = formData.get("hashtags")?.toString() || ""
  const scheduledAtStr = formData.get("scheduledAt")?.toString()

  // Parse platforms from JSON
  const selectedPlatforms: Platform[] = JSON.parse(platformsJson)
  const platforms: PlatformMetadata[] = selectedPlatforms.map(platform => ({
    platform,
    status: "draft" as const,
  }))

  // Parse media from JSON
  const media: PostMedia[] = JSON.parse(mediaJson)

  // Parse hashtags
  const hashtags = hashtagsStr
    .split(/\s+/)
    .filter(tag => tag.startsWith('#'))
    .map(tag => tag.slice(1))
    .filter(tag => tag.length > 0)

  // Parse scheduled date
  const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : undefined

  const now = new Date()

  const result = await useCase.execute({
    userId: userIdCookie.value,
    title,
    body,
    contentType,
    platforms,
    media,
    hashtags,
    scheduledAt,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath("/crm/posts")

  // Return platform results for client-side toast notifications
  return {
    success: true,
    platformResults: result.platformResults,
    postId: result.post.id
  }
}

export async function getPostsAction() {
  const useCase = await getPostsUseCase()
  const result = await useCase.execute()
  return result.posts
}

export async function deletePostAction(id: string) {
  const useCase = await deletePostUseCase()

  // Get current user ID from cookies
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get("admin_user_id")
  if (!userIdCookie) {
    throw new Error("Unauthorized - Please login first")
  }

  await useCase.execute({
    id,
    userId: userIdCookie.value
  })
  revalidatePath("/crm/posts")
}

export async function updatePostAction(id: string, formData: FormData) {
  const useCase = await updatePostUseCase()

  // Get current user ID from cookies
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get("admin_user_id")
  if (!userIdCookie) {
    throw new Error("Unauthorized - Please login first")
  }

  const title = formData.get("title")?.toString() || ""
  const body = formData.get("body")?.toString()
  const contentType = (formData.get("contentType")?.toString() as ContentType) || "post"
  const platformsJson = formData.get("platforms")?.toString() || ""
  const mediaJson = formData.get("media")?.toString() || ""
  const hashtagsStr = formData.get("hashtags")?.toString() || ""
  const scheduledAtStr = formData.get("scheduledAt")?.toString() || ""

  const updateData: any = {
    id,
    userId: userIdCookie.value,
    updatedAt: new Date(),
  }

  if (title) updateData.title = title
  if (body !== undefined) updateData.body = body
  if (contentType) updateData.contentType = contentType

  if (platformsJson) {
    const selectedPlatforms: Platform[] = JSON.parse(platformsJson)
    updateData.platforms = selectedPlatforms.map(platform => ({
      platform,
      status: "draft" as const,
    }))
  }

  if (mediaJson) {
    updateData.media = JSON.parse(mediaJson)
  }

  if (hashtagsStr !== undefined) {
    updateData.hashtags = hashtagsStr
      .split(/\s+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.slice(1))
      .filter(tag => tag.length > 0)
  }

  if (scheduledAtStr) {
    updateData.scheduledAt = new Date(scheduledAtStr)
  }

  await useCase.execute(updateData)
  revalidatePath("/crm/posts")
}
