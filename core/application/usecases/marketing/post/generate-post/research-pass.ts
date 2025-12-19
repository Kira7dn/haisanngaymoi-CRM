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
import { GenerationSession } from "@/core/application/interfaces/marketing/post-gen-service"

export class ResearchPass implements GenerationPass {
  readonly name: PassType = 'research'


  async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
    const { idea, product, brand, contentType, sessionId } = ctx
    const session = ctx.cache.get<GenerationSession>(ctx.sessionId);
    // Điều kiện skip research:
    // - đã có researchPass trong session và idea không khác so với session.researchPass.initIdea (cần bổ sung logic set idea vào form researchPass)
    // - hoặc không có PerplexityService được cấu hình
    const canSkip = 
      (session?.researchPass && session.researchPass.initialIdea === idea) || 
      !PerplexityService.isConfigured()
    if (canSkip) {
      yield { type: 'pass:skip', pass: 'research' }
      return
    }

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
          initialIdea: idea,
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
          initialIdea: "",
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
