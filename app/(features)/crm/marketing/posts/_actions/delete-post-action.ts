"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { deletePostUseCase } from "@/app/api/posts/depends"

export async function deletePostAction(id: string) {
    const useCase = await deletePostUseCase()

    // Get current user ID from cookies
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get("admin_user_id")
    if (!userIdCookie) {
        throw new Error("Unauthorized - Please login first")
    }

    const result = await useCase.execute({
        id,
        userId: userIdCookie.value
    })

    revalidatePath("/crm/posts")
    return result
}