import { ILLMService } from "@/core/application/interfaces/marketing/post-gen-service"
import { MultiPassGenRequest } from "../gen-multi-pass"
import { z } from "zod"
import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass";

const DraftPassSchema = z.object({
    title: z.string(),
    content: z.string(),
})

export async function draftPass(
    llm: ILLMService,
    request: MultiPassGenRequest,
    brandContext: string,
    outline: string
): Promise<{ title: string; content: string }> {
    const prompt = `Write the full content based on this outline.

      Brand Context:
      ${brandContext}

      Outline:
      ${outline}

      Requirements:
      - Write engaging, natural content
      - Match the brand voice and style
      - Include a clear call-to-action
      - Optimize for ${request.platform || "social media"}

      Return ONLY a valid JSON object with this exact format:
      {
        "title": "Post title as a single string (10-200 characters)",
        "content": "Full post content as a single string (50-3000 characters)"
      }

      Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
    `

    const response = await llm.generateCompletion({
        systemPrompt: "You are a professional content writer. Always respond with valid JSON only. Never use markdown code blocks.",
        prompt,
        temperature: 0.7,
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
        console.log('[Multi-Pass] Draft pass parsed:', { titleLength: parsed.title?.length, contentLength: parsed.content?.length })
        return DraftPassSchema.parse(parsed)
    } catch (error) {
        console.error('[Multi-Pass] Failed to parse draft response:', cleanContent)
        throw new Error(`Invalid JSON response from draft pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
   * Draft pass with streaming support
   */
export async function* draftPassStreaming(
    llm: ILLMService,
    request: MultiPassGenRequest,
    brandContext: string,
    outline: string
): AsyncGenerator<string> {
    const prompt = `Write the full content based on this outline.

      Brand Context:
      ${brandContext}

      Outline:
      ${outline}

      Requirements:
      - Write engaging, natural content
      - Match the brand voice and style
      - Include a clear call-to-action
      - Optimize for ${request.platform || "social media"}

      Return ONLY a valid JSON object with this exact format:
      {
        "title": "Post title as a single string (10-200 characters)",
        "content": "Full post content as a single string (50-3000 characters)"
      }

      Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
    `

    for await (const token of llm.generateStreamingCompletion({
        systemPrompt: "You are a professional content writer. Always respond with valid JSON only. Never use markdown code blocks.",
        prompt,
        temperature: 0.7,
        maxTokens: 1500,
    })) {
        yield token
    }
}

export class DraftStreamingPass implements GenerationPass {
    readonly name: PassType = 'draft'

    canSkip(session: any): boolean {
        return Boolean(session.draftPass)
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const session = ctx.cache.get(ctx.sessionId)
        yield { type: 'pass:start', pass: 'draft' }

        const prompt = `Write the full content based on this outline.

            Brand Context:
            ${ctx.brand}

            Outline:
            ${session.outlinePass?.outline}

            Requirements:
            - Write engaging, natural content
            - Match the brand voice and style
            - Include a clear call-to-action
            - Optimize for ${ctx.request.platform || "social media"}

            Return ONLY a valid JSON object with this exact format:
            {
            "title": "Post title as a single string (10-200 characters)",
            "content": "Full post content as a single string (50-3000 characters)"
            }

            Do not include any markdown, code blocks, or additional text. Only return the raw JSON object.
        `

        let buffer = ''
        for await (const token of ctx.llm.generateStreamingCompletion({
            systemPrompt: "You are a professional content writer. Always respond with valid JSON only. Never use markdown code blocks.",
            prompt,
            temperature: 0.7,
            maxTokens: 1500,
        })) {
            buffer += token
            yield { type: 'body:token', pass: 'draft', content: token }
        }

        ctx.cache.updateSession(ctx.sessionId, {
            draftPass: {
                draft: buffer,
                wordCount: buffer.split(/\s+/).length,
            },
        })

        yield { type: 'pass:complete', pass: 'draft' }
    }
}