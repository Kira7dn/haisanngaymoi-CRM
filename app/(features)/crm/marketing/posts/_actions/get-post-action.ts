"use server"
import { getPostsUseCase } from "@/app/api/posts/depends"


export async function getPostsAction() {
    const useCase = await getPostsUseCase()
    const result = await useCase.execute()
    return result.posts
}