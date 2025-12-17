/**
 * Generate Post Multi-Pass Use Case
 * Orchestrates multi-pass content generation with episodic memory
 * Passes: Idea → Angle → Outline → Draft → Enhance
 */

import { PerplexityService } from "@/infrastructure/adapters/perplexity-service"
import { VectorDBService } from "@/infrastructure/adapters/vector-db"
import { ResearchTopicUseCase } from "./research-topic"
import { RetrieveKnowledgeUseCase } from "../retrieve-knowledge"
import { z } from "zod"
import { GenerationSession, ILLMService, ICacheService } from "@/core/application/interfaces/marketing/post-gen-service"
import { BrandMemoryService } from "@/core/application/interfaces/brand-memory-service"
import type { BrandMemory } from "@/core/domain/brand-memory"
import { ideaPass } from "./ideapass"
import { anglePass } from "./angle-pass"
import { outlinePass } from "./outline-pass"
import { draftPass, draftPassStreaming } from "./draft-pass"
import { enhancePass, enhancePassStreaming, parseEnhancedContent } from "./enhance-pass"
import { scoringPass } from "./scoring-pass"
import { Product } from "@/core/domain/catalog/product"



export interface MultiPassGenRequest {
  topic?: string
  platform?: string
  idea?: string // NEW: Post idea from schedule
  product?: Product // NEW: Product URL for context
  detailInstruction?: string // NEW: Specific instructions for this post
  sessionId?: string
}

export interface MultiPassGenResponse {
  sessionId: string
  title: string
  body: string
  content: string // Alias cho body để tương thích
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

type PassType =
  | 'research'
  | 'rag'
  | 'idea'
  | 'angle'
  | 'outline'
  | 'draft'
  | 'enhance'
  | 'scoring'


/**
 * Multi-pass content generation orchestrator
 */
export class GeneratePostMultiPassUseCase {
  constructor(
    private readonly llmService: ILLMService,
    private readonly cacheService: ICacheService,
    private readonly brandMemoryRepo: BrandMemoryService,
    private readonly researchTopicUseCase: ResearchTopicUseCase,
  ) { }

  /**
   * Execute multi-pass generation with streaming support
   */
  async execute(request: MultiPassGenRequest): Promise<MultiPassGenResponse> {
    // Get brand memory from repository
    const brandMemory = await this.brandMemoryRepo.get()

    // Get or create session
    const sessionId = request.sessionId || `session_${Date.now()}`
    const session = this.cacheService.getOrCreateSession(sessionId, {
      topic: request.topic,
      platform: request.platform,
    })

    const brandContext = this.buildBrandContext(brandMemory || undefined)
    const passesCompleted: string[] = []

    // Research Phase (optional - if topic provided and Perplexity configured)
    let researchContext = ''
    if (request.topic && PerplexityService.isConfigured()) {
      try {
        console.log('[Multi-Pass] Starting research phase...')
        const research = await this.researchTopicUseCase.execute({
          topic: request.topic,
          language: brandMemory?.language || 'Vietnamese'
        })

        researchContext = `
          Research Insights:
          ${research.insights.join('\n- ')}

          Recommended Angles:
          ${research.recommendedAngles.join('\n- ')}

          Risks to Avoid:
          ${research.risks.join('\n- ')}
        `
        console.log('[Multi-Pass] Research completed:', research)
      } catch (error) {
        console.warn('[Multi-Pass] Research failed, continuing without research:', error)
      }
    }

    // RAG Phase (optional - if topic provided and VectorDB configured)
    let ragContext = ''
    if (request.topic && VectorDBService.isConfigured()) {
      try {
        console.log('[Multi-Pass] Starting RAG retrieval...')
        const ragUseCase = new RetrieveKnowledgeUseCase()
        const rag = await ragUseCase.execute({
          topic: request.topic,
          limit: 5
        })

        if (rag.sources.length > 0) {
          ragContext = `
          Relevant Knowledge from Past Content:
          ${rag.context}
        `
          console.log('[Multi-Pass] RAG retrieval completed:', rag.sources.length, 'sources found')
        }
      } catch (error) {
        console.warn('[Multi-Pass] RAG retrieval failed, continuing without RAG:', error)
      }
    }

    // Pass 1: Idea Generation (with research context)
    if (!session.ideaPass) {
      const ideas = await ideaPass(this.llmService, request, brandContext + researchContext)
      this.cacheService.updateSession(sessionId, {
        ideaPass: {
          ideas: ideas.ideas,
          selectedIdea: ideas.ideas[0], // Auto-select first idea
        },
      })
      passesCompleted.push("idea")
    }

    // Pass 2: Angle Exploration
    const updatedSession = this.cacheService.get<GenerationSession>(sessionId)!
    if (!updatedSession.anglePass) {
      const angles = await anglePass(this.llmService, request, brandContext, updatedSession.ideaPass!.selectedIdea)
      this.cacheService.updateSession(sessionId, {
        anglePass: {
          angles: angles.angles,
          selectedAngle: angles.angles[0], // Auto-select first angle
        },
      })
      passesCompleted.push("angle")
    }

    // Pass 3: Outline Creation
    const session2 = this.cacheService.get<GenerationSession>(sessionId)!
    if (!session2.outlinePass) {
      const outline = await outlinePass(
        this.llmService,
        request,
        brandContext,
        session2.ideaPass!.selectedIdea,
        session2.anglePass!.selectedAngle
      )
      this.cacheService.updateSession(sessionId, {
        outlinePass: {
          outline: outline.outline,
          sections: outline.sections,
          title: outline.title,
        },
      })
      passesCompleted.push("outline")
    }

    // Pass 4: Draft Writing (with RAG context)
    const session3 = this.cacheService.get<GenerationSession>(sessionId)!
    if (!session3.draftPass) {
      const draft = await draftPass(this.llmService, request, brandContext + ragContext, session3.outlinePass!.outline)
      this.cacheService.updateSession(sessionId, {
        draftPass: {
          draft: draft.content,
          wordCount: draft.content.split(/\s+/).length,
        },
      })
      passesCompleted.push("draft")
    }

    // Pass 5: Enhancement (with RAG context)
    const session4 = this.cacheService.get<GenerationSession>(sessionId)!
    const enhanced = await enhancePass(this.llmService, request, brandContext + ragContext, session4.draftPass!.draft)
    this.cacheService.updateSession(sessionId, {
      enhancePass: {
        enhanced: enhanced.content,
        improvements: enhanced.improvements,
      },
    })
    passesCompleted.push("enhance")

    // Pass 6: Scoring
    const scoringResult = await scoringPass(this.llmService, request, brandContext + ragContext, enhanced.content)
    try {
      console.log('[Multi-Pass] Scoring pass:', scoringResult)
      passesCompleted.push('scoring')

      // Final session
      const finalSession = this.cacheService.get<GenerationSession>(sessionId)!

      return {
        sessionId,
        title: enhanced.title,
        body: enhanced.content,
        content: enhanced.content,
        metadata: {
          ideasGenerated: finalSession.ideaPass?.ideas.length || 0,
          anglesExplored: finalSession.anglePass?.angles.length || 0,
          passesCompleted,
          improvements: enhanced.improvements,
          score: scoringResult.score,
          scoreBreakdown: scoringResult.scoreBreakdown,
          weaknesses: scoringResult.weaknesses,
          suggestedFixes: scoringResult.suggestedFixes,
        },
      }
    } catch (error) {
      console.error('[Multi-Pass] Failed to parse scoring response:', scoringResult)
      // Fallback: return without scoring
      const finalSession = this.cacheService.get<GenerationSession>(sessionId)!

      return {
        sessionId,
        title: enhanced.title,
        body: enhanced.content,
        content: enhanced.content,
        metadata: {
          ideasGenerated: finalSession.ideaPass?.ideas.length || 0,
          anglesExplored: finalSession.anglePass?.angles.length || 0,
          passesCompleted,
          improvements: enhanced.improvements,
        },
      }
    }
  }

  private buildBrandContext(brandMemory?: BrandMemory): string {
    if (!brandMemory) {
      return "Premium fresh seafood from Cô Tô Island, professional tone, Vietnamese language."
    }

    const parts = [
      `Brand: ${brandMemory.brandDescription}`,
      `Niche: ${brandMemory.niche}`,
      `Style: ${brandMemory.contentStyle}`,
      `Language: ${brandMemory.language}`,
    ]

    if (brandMemory.brandVoice) {
      parts.push(`Tone: ${brandMemory.brandVoice.tone}`)
      if (brandMemory.brandVoice.writingPatterns?.length > 0) {
        parts.push(`Writing patterns: ${brandMemory.brandVoice.writingPatterns.join(", ")}`)
      }
    }

    if (brandMemory.keyPoints?.length) {
      parts.push(`Key points: ${brandMemory.keyPoints.join(", ")}`)
    }

    return parts.join("\n")
  }
}
