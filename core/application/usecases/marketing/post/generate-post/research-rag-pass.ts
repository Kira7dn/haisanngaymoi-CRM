/**
 * Research and RAG Passes for content generation pipeline
 */

import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass"
import { PerplexityService } from "@/infrastructure/adapters/perplexity-service"
import { VectorDBService } from "@/infrastructure/adapters/vector-db"
import { ResearchTopicUseCase } from "./research-topic"
import { RetrieveKnowledgeUseCase } from "../retrieve-knowledge"

/**
 * Research Pass - Uses Perplexity to research topics
 */
export class ResearchPass implements GenerationPass {
    readonly name: PassType = 'research'

    canSkip(session: any): boolean {
        // Skip if already done OR if not configured
        return Boolean(session.researchPass) || !PerplexityService.isConfigured()
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const session = ctx.cache.get(ctx.sessionId)

        // Skip if no topic or Perplexity not configured
        if (!ctx.request.topic) {
            console.log('[Research Pass] Skipping - no topic provided')
            return
        }

        yield { type: 'pass:start', pass: 'research' }

        try {
            // Create instances of required services
            const perplexityService = new PerplexityService()
            const researchUseCase = new ResearchTopicUseCase(ctx.llm, perplexityService)

            const research = await researchUseCase.execute({
                topic: ctx.request.topic,
                language: session.brandMemory?.language || 'Vietnamese'
            })

            // Store research results in session
            ctx.cache.updateSession(ctx.sessionId, {
                researchPass: {
                    insights: research.insights,
                    risks: research.risks,
                    recommendedAngles: research.recommendedAngles,
                    sources: research.sources,
                }
            })

            console.log(`[Research Pass] Found ${research.insights.length} insights`)
        } catch (error) {
            console.warn('[Research Pass] Failed, continuing without research:', error)
            // Don't fail the pipeline, just skip this pass
            ctx.cache.updateSession(ctx.sessionId, {
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

/**
 * RAG Pass - Retrieves relevant knowledge from vector database
 */
export class RAGPass implements GenerationPass {
    readonly name: PassType = 'rag'

    canSkip(session: any): boolean {
        // Skip if already done OR if not configured
        return Boolean(session.ragPass) || !VectorDBService.isConfigured()
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        // Skip if no topic or Vector DB not configured
        if (!ctx.request.topic) {
            console.log('[RAG Pass] Skipping - no topic provided')
            return
        }

        yield { type: 'pass:start', pass: 'rag' }

        try {
            const ragUseCase = new RetrieveKnowledgeUseCase()
            const rag = await ragUseCase.execute({
                topic: ctx.request.topic,
                limit: 5
            })

            // Store RAG results in session
            ctx.cache.updateSession(ctx.sessionId, {
                ragPass: {
                    context: rag.context,
                    sources: rag.sources,
                }
            })

            console.log(`[RAG Pass] Found ${rag.sources.length} relevant sources`)
        } catch (error) {
            console.warn('[RAG Pass] Failed, continuing without RAG:', error)
            // Don't fail the pipeline, just skip this pass
            ctx.cache.updateSession(ctx.sessionId, {
                ragPass: {
                    context: '',
                    sources: [],
                }
            })
        }

        yield { type: 'pass:complete', pass: 'rag' }
    }
}
