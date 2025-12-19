import { z } from "zod"
import {
    GenerationEvent,
    GenerationPass,
    PassContext,
    PassType,
} from "../stream-post-generationn"
import { GenerationSession } from "@/core/application/usecases/marketing/post/generate-post/post-gen-service.interfaces"

/**
 * =========================
 * Schema
 * =========================
 */
const AnglePassSchema = z.object({
    angles: z.array(z.string()).min(3),
})


/**
 * =========================
 * Angle Generation Pass
 * =========================
 */
export class AnglePass implements GenerationPass {
    readonly name: PassType = "angle"

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const session = await ctx.cache.get<GenerationSession>(ctx.sessionId)
        const { idea, brand, product, sessionId, hasChange } = ctx
        const canSkip = (!idea || (session?.anglePass && !hasChange))
        if (canSkip) {
            yield { type: "pass:skip", pass: "angle" }
            return
        }
        yield { type: "pass:start", pass: "angle" }

        const prompt = `
            You are a senior content strategist.

            Your task is to explore DIFFERENT ANGLES for the same content idea.
            An angle defines *how* the idea is framed, not what the idea is.

            ${brand?.brandDescription ? `Brand context (for alignment only): ${brand?.brandDescription}` : ""}

            Core content idea:
            ${session?.ideaPass?.selectedIdea || idea}

            ${product?.name ? `Product reference (optional):${product?.name} 
                The product may be referenced subtly as context or inspiration,
                without becoming the main focus or direct promotion.` : ""
            }

            TASK:
            Generate exactly 3 DISTINCT content angles that:
            - Frame the idea from different audience perspectives, motivations, or emotional lenses
            - Speak to different reasons why someone would care about this idea
            - Stay consistent with the brand voice and niche
            - Stay aligned with the brand and product context if provided

            RULES:
            An angle should represent a DISTINCT FRAMING DIMENSION, such as:
            - Educational vs experiential
            - Problem-focused vs outcome-focused
            - Emotional vs rational
            - Beginner vs expert perspective

            Avoid:
            - Rewriting the idea in different words
            - Generic or abstract descriptions
            - Angles that differ only in tone but not in perspective

            Return ONLY valid JSON in this format:
            {
            "angles": ["Angle 1", "Angle 2", "Angle 3"]
            }
            `.trim()

        const response = await ctx.llm.generateCompletion({
            systemPrompt:
                "You are a professional content strategist. Always return valid JSON only. Never include markdown or extra text.",
            prompt,
            temperature: 0.8,
            maxTokens: 500,
        })

        let cleanContent = response.content.trim()
        cleanContent = cleanContent
            .replace(/^```json/i, "")
            .replace(/^```/i, "")
            .replace(/```$/, "")
            .trim()

        try {
            const parsed = JSON.parse(cleanContent)
            console.log('[Multi-Pass] Angle pass parsed:', parsed)
            const angles = AnglePassSchema.parse(parsed)

            const updateData: any = {
                anglePass: {
                    angles: angles.angles,
                    selectedAngle: angles.angles[0],
                }
            }

            await ctx.cache.updateSession(sessionId, updateData)
        } catch (error) {
            console.error("[AnglePass] Invalid response:", cleanContent)
            throw new Error(
                `AnglePass failed to parse LLM response: ${error instanceof Error ? error.message : "Unknown error"}`,
            )
        }

        yield { type: "pass:complete", pass: "angle" }
    }
}
