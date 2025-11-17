"use server"

import { revalidatePath } from "next/cache"
import { getPostsUseCase, createPostUseCase, updatePostUseCase, deletePostUseCase } from "@/app/api/posts/depends"

export async function createPostAction(formData: FormData) {
  const useCase = await createPostUseCase()
  const title = formData.get("title")?.toString() || ""
  const body = formData.get("body")?.toString() || ""
  const now = new Date()

  await useCase.execute({ title, body, createdAt: now, updatedAt: now })
  revalidatePath("/posts")
}

export async function getPostsAction() {
  const useCase = await getPostsUseCase()
  const result = await useCase.execute()
  return result.posts
}

export async function deletePostAction(id: string) {
  const useCase = await deletePostUseCase()
  await useCase.execute({ id })
  revalidatePath("/posts")
}

export async function updatePostAction(id: string, formData: FormData) {
  const useCase = await updatePostUseCase()
  const title = formData.get("title")?.toString()
  const body = formData.get("body")?.toString()
  const now = new Date()

  await useCase.execute({ id, title, body, updatedAt: now })
  revalidatePath("/posts")
}
