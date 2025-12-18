import { z } from "zod"
import { GenerationEvent, GenerationPass, MultiPassGenRequest, PassContext, PassType } from "./stream-gen-multi-pass"

const AnglePassSchema = z.object({
    angles: z.array(z.string()).min(3),
})

export class AnglePass implements GenerationPass {
    readonly name: PassType = 'angle'

    canSkip(session: any): boolean {
        return Boolean(session.anglePass)
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const session = ctx.cache.get(ctx.sessionId)

        if (!session.ideaPass?.selectedIdea) {
            throw new Error('Angle pass requires idea pass to be completed first')
        }

        yield { type: 'pass:start', pass: 'angle' }

        const prompt = `Generate 3 different angles for this content idea.

            Brand Context:
            ${ctx.brandContext}

            Idea: ${session.ideaPass.selectedIdea}

            Requirements:
            - Each angle must approach the idea differently
            - Consider different audience perspectives
            - Make angles compelling and unique

            Return ONLY a valid JSON object with this exact format:
            {
            "angles": ["angle 1 as a single string", "angle 2 as a single string", "angle 3 as a single string"]
            }

            Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
        `

        const response = await ctx.llm.generateCompletion({
            systemPrompt: "You are a content strategist. Always respond with valid JSON only. Never use markdown code blocks.",
            prompt,
            temperature: 0.8,
            maxTokens: 500,
        })

        // Clean response content
        let cleanContent = response.content.trim()
        if (cleanContent.startsWith('```json')) {
            cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        } else if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/```\n?/g, '').trim()
        }

        try {
            const parsed = JSON.parse(cleanContent)
            console.log('[Multi-Pass] Angle pass parsed:', parsed)
            const angles = AnglePassSchema.parse(parsed)

            ctx.cache.updateSession(ctx.sessionId, {
                anglePass: {
                    angles: angles.angles,
                    selectedAngle: angles.angles[0],
                },
            })
        } catch (error) {
            console.error('[Multi-Pass] Failed to parse angle response:', cleanContent)
            throw new Error(`Invalid JSON response from angle pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        yield { type: 'pass:complete', pass: 'angle' }
    }
}