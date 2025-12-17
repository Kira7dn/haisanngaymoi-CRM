import { ILLMService } from "@/core/application/interfaces/marketing/post-gen-service"
import { MultiPassGenRequest } from "../gen-multi-pass"
import { z } from "zod"
import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass"

const OutlinePassSchema = z.object({
    outline: z.string(),
    sections: z.array(z.string()),
    title: z.string(),
})

export async function outlinePass(
    llm: ILLMService,
    request: MultiPassGenRequest,
    brandContext: string,
    idea: string,
    angle: string
): Promise<{
    title: string
    outline: string
    sections: string[]
}> {
    const prompt = `
      You are creating a CONTENT STRUCTURE ONLY.

      Brand Context:
      ${brandContext}

      Idea: ${idea}
      Angle: ${angle}

      Requirements:
      - Generate a short, catchy CONTENT TITLE (max 12 words)
      - Create a clear logical outline for social media
      - Structure must include: Hook → Main Points → CTA
      - Do NOT repeat the title inside the outline
      - Sections must be concise and scannable

      Return ONLY valid JSON in EXACT format below:
      {
        "title": "string",
        "outline": "string",
        "sections": ["string", "string", "string"]
      }

      Rules:
      - No markdown
      - No explanations
      - No extra text
      - JSON only
    `.trim()

    const response = await llm.generateCompletion({
        systemPrompt:
            'You are a senior content strategist. Respond ONLY with valid JSON. No markdown. No commentary.',
        prompt,
        temperature: 0.6,
        maxTokens: 500,
    })

    let clean = response.content.trim()

    // Defensive cleaning
    clean = clean
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

    let parsed: unknown

    try {
        parsed = JSON.parse(clean)
    } catch (err) {
        console.error('[Multi-Pass][Outline] Raw response:', response.content)
        throw new Error('Outline pass returned invalid JSON')
    }

    const result = OutlinePassSchema.parse(parsed)

    // 🛡️ Normalize & safety guards
    return {
        title: result.title?.trim() || idea,
        outline: result.outline.trim(),
        sections: Array.isArray(result.sections)
            ? result.sections.map(s => s.trim())
            : [],
    }
}

export class OutlinePass implements GenerationPass {
    readonly name: PassType = 'outline'

    canSkip(session: any): boolean {
        return Boolean(session.outlinePass)
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const session = ctx.cache.get(ctx.sessionId)

        if (!session.ideaPass?.selectedIdea || !session.anglePass?.selectedAngle) {
            throw new Error('Outline pass requires idea and angle passes to be completed first')
        }

        yield { type: 'pass:start', pass: 'outline' }

        const prompt = `
            You are creating a CONTENT STRUCTURE ONLY.

            Brand Context:
            ${ctx.brandContext}

            Idea: ${session.ideaPass.selectedIdea}
            Angle: ${session.anglePass.selectedAngle}

            Requirements:
            - Generate a short, catchy CONTENT TITLE (max 12 words)
            - Create a clear logical outline for social media
            - Structure must include: Hook → Main Points → CTA
            - Do NOT repeat the title inside the outline
            - Sections must be concise and scannable

            Return ONLY valid JSON in EXACT format below:
            {
            "title": "string",
            "outline": "string",
            "sections": ["string", "string", "string"]
            }

            Rules:
            - No markdown
            - No explanations
            - No extra text
            - JSON only
        `.trim()

        const response = await ctx.llm.generateCompletion({
            systemPrompt:
                'You are a senior content strategist. Respond ONLY with valid JSON. No markdown. No commentary.',
            prompt,
            temperature: 0.6,
            maxTokens: 500,
        })

        let clean = response.content.trim()

        // Defensive cleaning
        clean = clean
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim()

        let parsed: unknown

        try {
            parsed = JSON.parse(clean)
        } catch (err) {
            console.error('[Multi-Pass][Outline] Raw response:', response.content)
            throw new Error('Outline pass returned invalid JSON')
        }

        const result = OutlinePassSchema.parse(parsed)

        // Normalize & safety guards
        const outline = {
            title: result.title?.trim() || session.ideaPass.selectedIdea,
            outline: result.outline.trim(),
            sections: Array.isArray(result.sections)
                ? result.sections.map(s => s.trim())
                : [],
        }

        // Emit title ready event
        if (outline.title) {
            yield {
                type: 'title:ready',
                title: outline.title,
            }
        }

        ctx.cache.updateSession(ctx.sessionId, {
            outlinePass: outline,
        })

        yield { type: 'pass:complete', pass: 'outline' }
    }
}
