import { ILLMService } from "@/core/application/interfaces/marketing/post-gen-service"
import { MultiPassGenRequest } from "../gen-multi-pass"
import { z } from "zod"
export const EnhancePassSchema = z.object({
    title: z.string(),
    content: z.string(),
    improvements: z.array(z.string()),
})

export async function enhancePass(
    llm: ILLMService,
    request: MultiPassGenRequest,
    brandContext: string,
    draft: string
): Promise<{ title: string; content: string; improvements: string[] }> {
    const prompt = `Enhance this draft content.

      Brand Context:
      ${brandContext}

      Draft:
      ${draft}

      Requirements:
      - Improve clarity and engagement
      - Strengthen the call-to-action
      - Fix any grammatical issues
      - Maintain the core message
      - List specific improvements made

      Return ONLY a valid JSON object with this exact format:
      {
        "title": "Enhanced title as a single string",
        "content": "Enhanced content as a single string",
        "improvements": ["improvement 1 as string", "improvement 2 as string", "improvement 3 as string"]
      }

      Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
    `

    const response = await llm.generateCompletion({
        systemPrompt: "You are an expert content editor. Always respond with valid JSON only. Never use markdown code blocks.",
        prompt,
        temperature: 0.6,
        maxTokens: 1500,
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
        console.log('[Multi-Pass] Enhance pass parsed:', {
            titleLength: parsed.title?.length,
            contentLength: parsed.content?.length,
            improvementsCount: parsed.improvements?.length
        })
        return EnhancePassSchema.parse(parsed)
    } catch (error) {
        console.error('[Multi-Pass] Failed to parse enhance response:', cleanContent)
        throw new Error(`Invalid JSON response from enhance pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

export function parseEnhancedContent(buffer: string): { title: string; content: string; improvements: string[] } {
    // Clean response content
    let cleanContent = buffer.trim()
    if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '').trim()
    }

    try {
        const parsed = JSON.parse(cleanContent)
        console.log('[Multi-Pass] Enhanced content parsed:', {
            titleLength: parsed.title?.length,
            contentLength: parsed.content?.length,
            improvementsCount: parsed.improvements?.length
        })
        return EnhancePassSchema.parse(parsed)
    } catch (error) {
        console.error('[Multi-Pass] Failed to parse enhanced response:', cleanContent)
        // Fallback: use the buffer as-is
        return {
            title: 'Enhanced Content',
            content: cleanContent,
            improvements: ['Content enhancement applied']
        }
    }
}

/**
   * Enhance pass with streaming support
   */
export async function* enhancePassStreaming(
    llm: ILLMService,
    request: MultiPassGenRequest,
    brandContext: string,
    draft: string
): AsyncGenerator<string> {
    const prompt = `Enhance this draft content.

      Brand Context:
      ${brandContext}

      Draft:
      ${draft}

      Requirements:
      - Improve clarity and engagement
      - Strengthen the call-to-action
      - Fix any grammatical issues
      - Maintain the core message
      - List specific improvements made

      Return ONLY a valid JSON object with this exact format:
      {
        "title": "Enhanced title as a single string",
        "content": "Enhanced content as a single string",
        "improvements": ["improvement 1 as string", "improvement 2 as string", "improvement 3 as string"]
      }

      Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
    `

    for await (const token of llm.generateStreamingCompletion({
        systemPrompt: "You are an expert content editor. Always respond with valid JSON only. Never use markdown code blocks.",
        prompt,
        temperature: 0.6,
        maxTokens: 1500,
    })) {
        yield token
    }
}

import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass"

export class EnhanceStreamingPass implements GenerationPass {
    readonly name: PassType = 'enhance'

    canSkip(session: any): boolean {
        return Boolean(session.enhancePass)
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const session = ctx.cache.get(ctx.sessionId)

        if (!session.draftPass?.draft) {
            throw new Error('Enhance pass requires draft pass to be completed first')
        }

        yield { type: 'pass:start', pass: 'enhance' }

        const prompt = `Enhance this draft content.

            Brand Context:
            ${ctx.brandContext}

            Draft:
            ${session.draftPass.draft}

            Requirements:
            - Improve clarity and engagement
            - Strengthen the call-to-action
            - Fix any grammatical issues
            - Maintain the core message
            - List specific improvements made

            Return ONLY a valid JSON object with this exact format:
            {
            "title": "Enhanced title as a single string",
            "content": "Enhanced content as a single string",
            "improvements": ["improvement 1 as string", "improvement 2 as string", "improvement 3 as string"]
            }

            Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
        `

        let buffer = ''
        for await (const token of ctx.llm.generateStreamingCompletion({
            systemPrompt: "You are an expert content editor. Always respond with valid JSON only. Never use markdown code blocks.",
            prompt,
            temperature: 0.6,
            maxTokens: 1500,
        })) {
            buffer += token
            yield { type: 'body:token', pass: 'enhance', content: token }
        }

        // Parse the complete buffer
        const enhanced = parseEnhancedContent(buffer)

        ctx.cache.updateSession(ctx.sessionId, {
            enhancePass: {
                enhanced: enhanced.content,
                improvements: enhanced.improvements,
            },
        })

        yield { type: 'pass:complete', pass: 'enhance' }
    }
}