/**
 * Generate Post Multi-Pass Use Case
 * Orchestrates multi-pass content generation with episodic memory
 * Passes: Idea → Angle → Outline → Draft → Enhance
 */

import { GenerationSession, ILLMService, ICacheService } from "@/core/application/interfaces/marketing/post-gen-service"
import { Product } from "@/core/domain/catalog/product"
import { BrandMemory } from "@/core/domain/brand-memory"


export interface MultiPassGenRequest {
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

export interface MultiPassGenResponse {
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
  | { type: 'final'; result: MultiPassGenResponse }
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

export interface PassContext extends Omit<MultiPassGenRequest, 'cache' | 'llm'> {
  sessionId: string
  cache: ICacheService;
  llm: ILLMService;
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
export class StreamMultiPassUseCase {
  constructor(
    private readonly llm: ILLMService,
    private readonly cache: ICacheService,
  ) { }

  /**
   * Execute multi-pass generation with streaming support
   */
  async *execute(request: MultiPassGenRequest, generatioPass: GenerationPass[]): AsyncGenerator<GenerationEvent> {

    try {

      // Get or create session
      const sessionId = request.sessionId || `session_${Date.now()}`
      this.cache.getOrCreateSession(sessionId, {
        idea: request.idea,
      })

      const ctx: PassContext = {
        ...request,
        sessionId: sessionId,
        cache: this.cache,
        llm: this.llm,
      }
      console.log("StreamMultiPassUseCase:", ctx);

      for (const pass of generatioPass) {
        const session = this.cache.get<GenerationSession>(sessionId)
        if (!session) {
          throw new Error(`Session not found for pass: ${pass.name}`)
        }
        yield* pass.execute(ctx, session)
      }
      const finalSession = this.cache.get<GenerationSession>(sessionId)
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
