/**
 * RAG Pass - Retrieves relevant internal knowledge from vector database
 */

import {
    GenerationEvent,
    GenerationPass,
    PassContext,
    PassType
} from "./stream-gen-multi-pass"

import { RetrieveKnowledgeUseCase } from "../retrieve-knowledge"
import { GenerationSession } from "@/core/application/interfaces/marketing/post-gen-service";

export class RAGPass implements GenerationPass {
    readonly name: PassType = 'rag'

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const { idea, product, brand, contentType, sessionId } = ctx
        const session = ctx.cache.get<GenerationSession>(sessionId);
        // Điều kiện skip:
        // - đã có ragPass trong session và idea không khác so với session.ragPass.initIdea hoặc product không khác so với session.ragPass.product (cần bổ sung logic set idea và pproduct vào session)
        // - hoặc không có PerplexityService được cấu hình
        const hasChange =
            session?.ragPass?.initialIdea === idea ||
            JSON.stringify(session?.ragPass?.product) !== JSON.stringify(product)
        const canSkip = (!idea && session?.researchPass && !hasChange)
        if (canSkip) {
            yield { type: 'pass:skip', pass: 'rag' }
            return
        }
        // 🔒 Gate condition (dynamic)
        if (!shouldRunRAG(ctx, session)) {
            console.log('[RAGPass] Skipped by gate condition')
            return
        }

        yield { type: 'pass:start', pass: 'rag' }

        try {
            const retrieveKnowledgeUseCase = new RetrieveKnowledgeUseCase()

            if (!ctx.idea) {
                console.log('[RAGPass] Skipped - no topic provided')
                return
            }

            const rag = await retrieveKnowledgeUseCase.execute({
                query: ctx.idea,
                limit: 5,
                // future-ready:
                // productId: ctx.product?.id,
            })

            // Combine all chunks into a single context
            const ragContext = rag.chunks
                .map(chunk => `${chunk.title}\n${chunk.content}`)
                .join('\n\n')

            // Map chunks to the expected sources format
            const sources = rag.chunks.map(chunk => ({
                postId: chunk.id,
                title: chunk.title,
                content: chunk.content,
                similarity: chunk.similarity
            }));

            ctx.cache.updateSession(ctx.sessionId, {
                ragPass: {
                    initialIdea: idea || '',
                    product: product,
                    ragContext,
                    sources,
                }
            })

            console.log(
                `[RAGPass] Retrieved ${rag.chunks.length} knowledge chunks`
            )
        } catch (error) {
            console.warn('[RAGPass] Failed, continuing without RAG:', error)
        }

        yield { type: 'pass:complete', pass: 'rag' }
    }
}


function shouldRunRAG(ctx: PassContext, session: any): boolean {
    if (!ctx.idea) return false

    const idea = ctx.idea.toLowerCase()

    const INTERNAL_KNOWLEDGE_TRIGGERS = [
        'chính sách',
        'điều khoản',
        'bảo hành',
        'đổi trả',
        'quy trình',
        'hướng dẫn',
        'cách sử dụng',
        'so sánh',
        'thông số',
        'giá',
        'ship',
        'vận chuyển',
    ]

    const isInternalQuery = INTERNAL_KNOWLEDGE_TRIGGERS
        .some(k => idea.includes(k))

    const hasProductContext = Boolean(ctx.product)

    const FACT_SENSITIVE_CONTENT_TYPES = [
        'ad',
        'product',
        'faq',
        'support',
        'landing',
    ]

    const isFactSensitive =
        ctx.contentType !== undefined &&
        FACT_SENSITIVE_CONTENT_TYPES.includes(ctx.contentType)

    const researchSignalsRisk =
        session?.researchPass?.risks?.length > 0

    let score = 0
    if (isInternalQuery) score += 2
    if (hasProductContext) score += 2
    if (isFactSensitive) score += 1
    if (researchSignalsRisk) score += 1

    return score >= 2
}
