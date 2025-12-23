// Use Node.js runtime for streaming batch operations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Max 60 seconds for batch save

import { createPostUseCase } from '@/app/api/posts/depends'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { Post } from '@/core/domain/marketing/post'

interface BatchSaveRequest {
  items: Post[]
}

export async function POST(request: NextRequest) {
  try {
    const { items }: BatchSaveRequest = await request.json()

    // Auth check
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get("admin_user_id")
    if (!userIdCookie) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login first' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userId = userIdCookie.value

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let savedCount = 0
        let failedCount = 0
        const errors: Array<{ idea: string; error: string }> = []

        try {
          const useCase = await createPostUseCase()

          // Send initial event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'start',
              total: items.length,
              savedCount: 0,
              progress: 0
            })}\n\n`)
          )

          // Process each item
          for (let i = 0; i < items.length; i++) {
            const item = items[i]

            try {
              // Parse dates from ISO strings back to Date objects
              // (JSON.stringify converts Date objects to strings)
              const scheduledAt = item.scheduledAt ? new Date(item.scheduledAt) : undefined
              const createdAt = item.createdAt ? new Date(item.createdAt) : undefined
              const updatedAt = item.updatedAt ? new Date(item.updatedAt) : undefined

              // Create post with optional fields from batchDraft
              const post = await useCase.execute({
                ...item,
                scheduledAt,
                createdAt,
                updatedAt,
                userId,
              })

              savedCount++

              // Calculate progress
              const progress = Math.round(((i + 1) / items.length) * 100)

              // Send progress event
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'progress',
                  total: items.length,
                  savedCount,
                  failedCount,
                  progress,
                  currentIndex: i + 1,
                  postId: post.id.toString(),
                  idea: item.idea || 'Unknown item'
                })}\n\n`)
              )
            } catch (error) {
              failedCount++
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'

              console.error(`[BatchSave] Failed to save "${item.idea || 'Unknown item'}":`, error)
              errors.push({
                idea: item.idea || 'Unknown item',
                error: errorMessage
              })

              // Send error event for this item
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'item-error',
                  idea: item.idea || 'Unknown item',
                  error: errorMessage,
                  savedCount,
                  failedCount
                })}\n\n`)
              )
            }
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              total: items.length,
              savedCount,
              failedCount,
              errors,
              progress: 100
            })}\n\n`)
          )

          controller.close()
        } catch (error) {
          const errorEvent = {
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
            savedCount,
            failedCount
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Content-Encoding': 'none',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
