/**
 * Generate Post Multi-Pass Use Case
 * Orchestrates multi-pass content generation with episodic memory
 * Passes: Idea → Angle → Outline → Draft → Enhance
 */

import { GenerationSession, ILLMService, ICacheService } from "@/core/application/usecases/marketing/post/generate-post/post-gen-service.interfaces"
import { Product } from "@/core/domain/catalog/product"
import { BrandMemory } from "@/core/domain/brand-memory"
import { DraftStreamingPass } from "./generatation-pass/draft-pass"
import { EnhanceStreamingPass } from "./generatation-pass/enhance-pass"
import { AnglePass } from "./generatation-pass/angle-pass"
import { ResearchPass } from "./generatation-pass/research-pass"
import { RAGPass } from "./generatation-pass/rag-pass"
import { IdeaGenerationPass } from "./generatation-pass/ideapass"
import { OutlinePass } from "./generatation-pass/outline-pass"
import { ScoringPass } from "./generatation-pass/scoring-pass"

export type AIGenerateAction = "multipass" | "singlepass" | "scoring" | "improve"
export interface PostGenRequest {
  action: AIGenerateAction
  // Post content
  title?: string
  body?: string
  hashtags?: string
  contentType?: string

  // Generation context
  idea?: string
  product?: Product
  contentInstruction?: string

  // Additional properties
  brand?: BrandMemory
  sessionId?: string

  // For backward compatibility
  detailInstruction?: string
}

export interface PostGenResponse {
  sessionId: string
  title: string
  body: string
  metadata: {
    ideasGenerated: number
    anglesExplored: number
    passesCompleted: string[]
    score?: number
    scoreBreakdown?: {
      clarity: number
      engagement: number
      brandVoice: number
      platformFit: number
      safety: number
    }
    weaknesses?: string[]
    suggestedFixes?: string[]
  }
}

/**
 * Generation Event Types for streaming
 */
export type GenerationEvent =
  | { type: 'pass:start'; pass: PassType }
  | { type: 'pass:skip'; pass: PassType }
  | { type: 'title:ready'; title: string }
  | { type: 'hashtags:ready'; hashtags: string }
  | { type: 'body:token'; pass: 'draft' | 'enhance'; content: string }
  | { type: 'pass:complete'; pass: PassType }
  | { type: 'final'; result: PostGenResponse }
  | { type: 'error'; message: string }

export type PassType =
  | 'research'
  | 'rag'
  | 'idea'
  | 'angle'
  | 'outline'
  | 'draft'
  | 'enhance'
  | 'scoring'

export interface PassContext extends Omit<PostGenRequest, 'cache' | 'llm'> {
  sessionId: string
  cache: ICacheService;
  llm: ILLMService;
  hasChange?: boolean;
}


export interface GenerationPass {
  readonly name: PassType
  execute(ctx: PassContext, session: GenerationSession): AsyncGenerator<GenerationEvent, void, unknown>
}


// =========================
// 4. Pipeline Registry
// =========================

/**
 * Multi-pass content generation orchestrator
 */
export class StreamPostUseCase {
  constructor(
    private readonly llm: ILLMService,
    private readonly cache: ICacheService,
  ) { }

  /**
   * Execute multi-pass generation with streaming support
   */
  async *execute(request: PostGenRequest, generatioPass?: GenerationPass[]): AsyncGenerator<GenerationEvent> {

    try {

      // Get or create session
      const sessionId = request.sessionId || `session_${Date.now()}`
      await this.cache.getOrCreateSession(sessionId, {
        idea: request.idea,
        productId: request.product?.id
      })

      const ctx: PassContext = {
        ...request,
        sessionId: sessionId,
        cache: this.cache,
        llm: this.llm,
      }
      console.log("StreamMultiPassUseCase:", ctx);

      // Execute passes with optimized session handling
      let currentSession = await this.cache.get<GenerationSession>(sessionId)
      if (!currentSession) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      // Calculate hasChange once for all passes
      const hasChange =
        (currentSession?.metadata.idea !== ctx.idea) ||
        (currentSession?.metadata.productId !== ctx.product?.id)
      const postGenerationPipeline = generatioPass || buildGenerationPipeline(request.action)
      for (const pass of postGenerationPipeline) {
        // Pass the current session and hasChange to avoid repeated cache calls
        const passContext = { ...ctx, hasChange }
        yield* pass.execute(passContext, currentSession)
      }

      // Update session if hasChange lastUpdatedAt after all passes complete
      if (hasChange) {
        await ctx.cache.updateSession(sessionId, {
          metadata: {
            ...currentSession.metadata,
            idea: ctx.idea,
            productId: ctx.product?.id,
            startedAt: currentSession.metadata?.startedAt || new Date(),
            lastUpdatedAt: new Date()
          }
        })
      }

      const finalSession = await this.cache.get<GenerationSession>(sessionId)
      if (!finalSession) {
        throw new Error('Final session not found')
      }


      // Build list of completed passes
      const passesCompleted: string[] = []
      if (finalSession.researchPass) passesCompleted.push('research')
      if (finalSession.ragPass) passesCompleted.push('rag')
      if (finalSession.ideaPass) passesCompleted.push('idea')
      if (finalSession.anglePass) passesCompleted.push('angle')
      if (finalSession.outlinePass) passesCompleted.push('outline')
      if (finalSession.draftPass) passesCompleted.push('draft')
      if (finalSession.enhancePass) passesCompleted.push('enhance')
      if (finalSession.scoringPass) passesCompleted.push('scoring')

      yield {
        type: 'final',
        result: {
          sessionId,
          title: finalSession.outlinePass?.title || ctx.title || 'Generated Content',
          body: finalSession.enhancePass?.enhanced || finalSession.draftPass?.draft || ctx.body || '',
          metadata: {
            ideasGenerated: finalSession.ideaPass?.ideas.length || 0,
            anglesExplored: finalSession.anglePass?.angles.length || 0,
            passesCompleted,
            score: finalSession.scoringPass?.score,
            scoreBreakdown: finalSession.scoringPass?.scoreBreakdown,
            weaknesses: finalSession.scoringPass?.weaknesses,
            suggestedFixes: finalSession.scoringPass?.suggestedFixes,
          },
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      yield { type: 'error', message: errorMessage }
    }
  }
}

export function buildGenerationPipeline(
  action: AIGenerateAction
): GenerationPass[] {
  switch (action) {
    case 'multipass':
      return [
        new ResearchPass(),
        new RAGPass(),
        new IdeaGenerationPass(),
        new AnglePass(),
        new OutlinePass(),
        new DraftStreamingPass(),
        new EnhanceStreamingPass(),
      ]

    case 'singlepass':
      return [
        new OutlinePass(),
        new DraftStreamingPass(),
      ]

    case 'scoring':
      return [
        new ScoringPass(),
      ]

    case 'improve':
      return [
        new EnhanceStreamingPass(),
        new ScoringPass(),
      ]

    default:
      throw new Error(`Unsupported action: ${action}`)
  }
}
