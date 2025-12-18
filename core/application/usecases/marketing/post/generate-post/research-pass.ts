/**
 * Research Pass
 * External knowledge gathering & synthesis
 */

import {
  GenerationEvent,
  GenerationPass,
  PassContext,
  PassType
} from "./stream-gen-multi-pass"

import { PerplexityService } from "@/infrastructure/adapters/perplexity-service"
import { ResearchTopicUseCase } from "../research-topic"

export class ResearchPass implements GenerationPass {
  readonly name: PassType = 'research'

  canSkip(session: any): boolean {
    return Boolean(session?.researchPass) || !PerplexityService.isConfigured()
  }

  async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
    const { idea, product, brand, contentType, sessionId } = ctx

    if (!idea) {
      console.log('[ResearchPass] Skipping - no idea')
      return
    }

    yield { type: 'pass:start', pass: 'research' }

    try {
      const perplexityService = new PerplexityService()
      const researchUseCase = new ResearchTopicUseCase(
        ctx.llm,
        perplexityService
      )

      const research = await researchUseCase.execute({
        topic: idea,
        contentType,
        product,
        brand
      })

      ctx.cache.updateSession(sessionId, {
        researchPass: {
          insights: research.insights,
          risks: research.risks,
          recommendedAngles: research.recommendedAngles,
          sources: research.sources,
        }
      })

      console.log(
        `[ResearchPass] Completed with ${research.insights.length} insights`
      )
    } catch (error) {
      console.warn('[ResearchPass] Failed, fallback to empty research', error)

      ctx.cache.updateSession(sessionId, {
        researchPass: {
          insights: [],
          risks: [],
          recommendedAngles: [],
          sources: [],
        }
      })
    }

    yield { type: 'pass:complete', pass: 'research' }
  }
}
