import { z } from "zod"
import { GenerationEvent, GenerationPass, MultiPassGenRequest, PassContext, PassType } from "./stream-gen-multi-pass"
import { GenerationSession } from "@/core/application/interfaces/marketing/post-gen-service"
import { BrandMemory } from "@/core/domain/brand-memory"
// Schema for each pass response
const IdeaPassSchema = z.object({
    ideas: z.array(z.string()).min(3),
})

function buildBrandContext(brand: BrandMemory): string {
    return `
Brand overview:
${brand.brandDescription}

Niche:
${brand.niche}

Brand voice:
${JSON.stringify(brand.brandVoice)}

Content style:
${brand.contentStyle}

Language:
${brand.language}

Key value points:
- ${brand.keyPoints.join("\n- ")}

${brand.contentsInstruction
            ? `Additional brand content rules:\n${brand.contentsInstruction}`
            : ""}
`.trim()
}


/**
* =========================
* Context typing (Idea pass)
* =========================
*/
export interface IdeaPassContext extends PassContext {
    brand: BrandMemory
    seedIdea?: string
    productContext?: {
        name: string
        description?: string
        keyBenefits?: string[]
    }[]
}

export class IdeaGenerationPass implements GenerationPass {
    readonly name: PassType = 'idea'

    canSkip(session: GenerationSession) {
        return Boolean(
            session.ideaPass &&
            session.ideaPass.ideas?.length >= 3
        )
    }


    async *execute(ctx: IdeaPassContext): AsyncGenerator<GenerationEvent> {
        yield { type: 'pass:start', pass: 'idea' }
        const { title, body, hashtags, idea, product: selectedProduct, brand, sessionId, contentInstruction } = ctx
        const session = ctx.cache.get<GenerationSession>(sessionId);
        const brandContext = buildBrandContext(brand)
        const productBlock = selectedProduct
            ? `
            Product reference:
            ${selectedProduct.name}

            Background:
            ${selectedProduct.detail || "N/A"}

            Reference link:
            ${selectedProduct.url || "N/A"}

            The product may appear implicitly through context, examples, or storytelling,
            serving as a gentle cue that encourages interest or consideration rather than direct promotion.
            `
            : ""


        const ragContext = session?.ragPass?.ragContext || ""
        const searchInsights = session?.researchPass?.insights.join("\n") || ""
        const searchRisks = session?.researchPass?.risks.join("\n") || ""
        const searchAngles = session?.researchPass?.recommendedAngles.join("\n") || ""
        const prompt = `You are a senior content strategist.
            You are generating HIGH-LEVEL CONTENT IDEAS (not captions, not full posts).

            Brand Context:
            ${brandContext}
            ${idea ? `Seed idea (may be weak or incomplete): ${idea}` : ""}
            ${productBlock}
            ${contentInstruction ? `Specific Instructions: ${contentInstruction}` : ""}

            Audience & market insights: ${searchInsights}
            Recommended strategic angles: ${searchAngles}
            Risks or sensitivities to avoid:${searchRisks}
            Reference knowledge (RAG): ${ragContext || "N/A"}
            TASK:
                Generate exactly 3 DISTINCT content ideas that:
                - Align strictly with the brand voice and niche
                - Emphasize 1–2 key value points
                - Leverage at least one research insight or recommended angle
                - Avoid listed risks
                RULES:
                - Write concept-level ideas only (what to talk about + angle)
                - Do NOT write captions, CTAs, hashtags, emojis, or hooks
                - Each idea must be clearly different in angle
                Return ONLY valid JSON in this format:
                {
                "ideas": ["Idea 1", "Idea 2", "Idea 3"]
                }
        `.trim()

        const response = await ctx.llm.generateCompletion({
            systemPrompt:
                "You are a professional content strategist. Always return valid JSON only. Never include markdown or extra text.", prompt,
            temperature: 0.9,
            maxTokens: 500,
        })

        // Clean response content
        let cleanContent = response.content.trim()
        cleanContent = cleanContent
            .replace(/^```json/i, "")
            .replace(/^```/i, "")
            .replace(/```$/, "")
            .trim()
        try {
            const parsed = JSON.parse(cleanContent)
            console.log('[Multi-Pass] Idea pass parsed:', parsed)
            const ideas = IdeaPassSchema.parse(parsed)

            ctx.cache.updateSession(sessionId, {
                ideaPass: {
                    ideas: ideas.ideas,
                    selectedIdea: ideas.ideas[0],
                    meta: {
                        usedResearch: Boolean(session?.researchPass),
                        usedRag: Boolean(ragContext),
                    },
                },
            })
        } catch (error) {
            console.error('[Multi-Pass] Failed to parse idea response:', cleanContent)
            throw new Error(`Invalid JSON response from idea pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        yield { type: 'pass:complete', pass: 'idea' }
    }
}