// Use Node.js runtime for complex operations (MongoDB, LLM, external APIs)
// Streaming works perfectly fine with Node.js runtime on Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createStreamMultiPassUseCase } from '@/app/api/posts/gen-content/depends'
import { MultiPassGenRequest } from '@/core/application/usecases/marketing/post/gen-multi-pass'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const params: MultiPassGenRequest = await request.json()

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          const useCase = await createStreamMultiPassUseCase()

          // Initial ping
          controller.enqueue(encoder.encode(': stream-start\n\n'))

          for await (const event of useCase.execute(params)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            )
          }

          controller.close()
        } catch (error) {
          const errorEvent = {
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
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
