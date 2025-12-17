import { MultiPassGenRequest } from "../gen-multi-pass"
import { z } from "zod"
import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass"
// Schema for each pass response
const IdeaPassSchema = z.object({
    ideas: z.array(z.string()).min(3),
})
export async function ideaPass(
    llm: any,
    request: MultiPassGenRequest,
    brandContext: string
): Promise<{ ideas: string[] }> {
    const prompt = `Generate 3 unique content ideas for social media.

      Brand Context:
      ${brandContext}

      ${request.topic ? `Topic: ${request.topic}` : ""}
      ${request.platform ? `Platform: ${request.platform}` : ""}
      ${request.idea ? `Initial Idea: ${request.idea}` : ""}
      ${request.productUrl ? `Product URL for reference: ${request.productUrl}` : ""}
      ${request.detailInstruction ? `Specific Instructions: ${request.detailInstruction}` : ""}

      Requirements:
      - Each idea must be unique and not repetitive
      - Focus on value for the audience
      - Make ideas specific and actionable

      Return ONLY a valid JSON object with this exact format:
      {
        "ideas": ["idea 1 as a single string", "idea 2 as a single string", "idea 3 as a single string"]
      }

      Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
    `

    const response = await llm.generateCompletion({
        systemPrompt: "You are a creative content strategist. Always respond with valid JSON only. Never use markdown code blocks.",
        prompt,
        temperature: 0.9,
        maxTokens: 500,
    })

    // Clean response content (remove markdown code blocks if present)
    let cleanContent = response.content.trim()
    if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '').trim()
    }

    try {
        const parsed = JSON.parse(cleanContent)
        console.log('[Multi-Pass] Idea pass parsed:', parsed)
        return IdeaPassSchema.parse(parsed)
    } catch (error) {
        console.error('[Multi-Pass] Failed to parse idea response:', cleanContent)
        throw new Error(`Invalid JSON response from idea pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

export class IdeaGenerationPass implements GenerationPass {
    readonly name: PassType = 'idea'

    canSkip(session: any): boolean {
        return Boolean(session.ideaPass)
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        yield { type: 'pass:start', pass: 'idea' }

        const prompt = `Generate 3 unique content ideas for social media.

            Brand Context:
            ${ctx.brandContext}
            ${ctx.request.topic ? `Topic: ${ctx.request.topic}` : ""}
            ${ctx.request.platform ? `Platform: ${ctx.request.platform}` : ""}
            ${ctx.request.idea ? `Initial Idea: ${ctx.request.idea}` : ""}
            ${ctx.request.productUrl ? `Product URL for reference: ${ctx.request.productUrl}` : ""}
            ${ctx.request.detailInstruction ? `Specific Instructions: ${ctx.request.detailInstruction}` : ""}

            Requirements:
            - Each idea must be unique and not repetitive
            - Focus on value for the audience
            - Make ideas specific and actionable

            Return ONLY a valid JSON object with this exact format:
            {
            "ideas": ["idea 1 as a single string", "idea 2 as a single string", "idea 3 as a single string"]
            }

            Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
        `

        const response = await ctx.llm.generateCompletion({
            systemPrompt: "You are a creative content strategist. Always respond with valid JSON only. Never use markdown code blocks.",
            prompt,
            temperature: 0.9,
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
            console.log('[Multi-Pass] Idea pass parsed:', parsed)
            const ideas = IdeaPassSchema.parse(parsed)

            ctx.cache.updateSession(ctx.sessionId, {
                ideaPass: {
                    ideas: ideas.ideas,
                    selectedIdea: ideas.ideas[0],
                },
            })
        } catch (error) {
            console.error('[Multi-Pass] Failed to parse idea response:', cleanContent)
            throw new Error(`Invalid JSON response from idea pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        yield { type: 'pass:complete', pass: 'idea' }
    }
}