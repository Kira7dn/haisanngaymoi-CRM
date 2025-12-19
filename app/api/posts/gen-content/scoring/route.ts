// Node.js runtime for MongoDB, LLM, external APIs
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createStreamMultiPassUseCase } from '@/app/api/posts/gen-content/depends'
import { ScoringPass } from '@/core/application/usecases/marketing/post/generate-post/generatation-pass/scoring-pass'
import { GenerationPass, PostGenRequest } from '@/core/application/usecases/marketing/post/generate-post/stream-post-generationn'

import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const params: PostGenRequest = await request.json()

    const postGenerationPipeline: GenerationPass[] = [
      new ScoringPass(),
    ]

    const useCase = await createStreamMultiPassUseCase()

    const events: any[] = []

    for await (const event of useCase.execute(params, postGenerationPipeline)) {
      events.push(event)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: events,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
