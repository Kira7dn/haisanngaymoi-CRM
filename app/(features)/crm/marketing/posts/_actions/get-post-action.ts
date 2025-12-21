"use server"
import { getPostsUseCase } from "@/app/api/posts/depends"
import type { PaginationOptions } from "@/infrastructure/db/base-repository"
import type { DateRangeFilter } from "@/core/application/interfaces/marketing/post-repo"

export interface GetPostsActionParams {
    usePagination?: boolean
    pagination?: PaginationOptions
    dateRange?: DateRangeFilter
}

export async function getPostsAction(params: GetPostsActionParams = {}) {
    const serverStartTime = performance.now()
    console.log('[getPostsAction] Server processing started at:', serverStartTime)

    const useCase = await getPostsUseCase()
    const result = await useCase.execute({
        usePagination: params.usePagination,
        pagination: params.pagination,
        dateRange: params.dateRange
    })

    const serverEndTime = performance.now()
    const serverProcessTime = serverEndTime - serverStartTime
    console.log(`[getPostsAction] Server processing completed in ${serverProcessTime.toFixed(2)}ms`)

    return {
        posts: result.posts,
        pagination: result.pagination,
        serverProcessTime: serverProcessTime
    }
}