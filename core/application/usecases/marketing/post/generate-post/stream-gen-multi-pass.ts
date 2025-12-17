/**
 * Generate Post Multi-Pass Use Case
 * Orchestrates multi-pass content generation with episodic memory
 * Passes: Idea → Angle → Outline → Draft → Enhance
 */

import { GenerationSession, ILLMService, ICacheService } from "@/core/application/interfaces/marketing/post-gen-service"
import { BrandMemoryService } from "@/core/application/interfaces/brand-memory-service"
import { DraftStreamingPass } from "./draft-pass"
import { EnhanceStreamingPass } from "./enhance-pass"
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
    improvements: string[]
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
  | { type: 'title:ready'; title: string }
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

export interface PassContext {
  topic?: string
  platform?: string
  idea?: string // NEW: Post idea from schedule
  product?: Product // NEW: Product URL for context
  detailInstruction?: string // NEW: Specific instructions for this post
  brand?: BrandMemory
  sessionId: string
  cache: any
  llm: any
}


export interface GenerationPass {
  readonly name: PassType
  canSkip(session: any): boolean
  execute(ctx: PassContext): AsyncGenerator<GenerationEvent, void, unknown>
}


// =========================
// 4. Pipeline Registry
// =========================

/**
 * Complete post generation pipeline with all passes
 * Order: Research → RAG → Idea → Angle → Outline → Draft → Enhance → Scoring
 *
 * Optional passes (skipped if not configured):
 * - ResearchPass: Requires PERPLEXITY_API_KEY
 * - RAGPass: Requires QDRANT_URL and QDRANT_API_KEY
 *
 * All passes implement canSkip() to check if they should run
 */
export const postGenerationPipeline: GenerationPass[] = [
  // new ResearchPass(),        // Optional: External research via Perplexity
  // new RAGPass(),             // Optional: Retrieve knowledge from vector DB
  // new IdeaGenerationPass(),  // Generate content ideas
  // new AnglePass(),           // Explore different angles
  // new OutlinePass(),         // Create content structure
  new DraftStreamingPass(),  // Write initial draft (streaming)
  new EnhanceStreamingPass(), // Enhance and polish content (streaming)
  // new ScoringPass(),         // Score content quality
]

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
  async *execute(request: MultiPassGenRequest): AsyncGenerator<GenerationEvent> {

    try {

      // Get or create session
      const sessionId = request.sessionId || `session_${Date.now()}`
      this.cache.getOrCreateSession(sessionId, {
        title: request.title,
      })

      const ctx: PassContext = {
        ...request,
        sessionId: sessionId,
        cache: this.cache,
        llm: this.llm,
      }
      console.log("StreamMultiPassUseCase:", ctx);

      for (const pass of postGenerationPipeline) {
        const session = this.cache.get(sessionId)
        if (pass.canSkip(session)) continue
        yield* pass.execute(ctx)
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
          title: finalSession.outlinePass?.title || 'Generated Content',
          body: finalSession.enhancePass?.enhanced ?? finalSession.draftPass?.draft ?? '',
          metadata: {
            ideasGenerated: finalSession.ideaPass?.ideas.length || 0,
            anglesExplored: finalSession.anglePass?.angles.length || 0,
            passesCompleted,
            improvements: finalSession.enhancePass?.improvements || [],
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
