import { GenerationSession } from "@/core/application/interfaces/marketing/post-gen-service"
import { z } from "zod"
import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass"

const OutlinePassSchema = z.object({
    outline: z.string(),
    title: z.string(),
    hashtags: z.array(z.string()),
})

export class OutlinePass implements GenerationPass {
    readonly name: PassType = 'outline'

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const { product: selectedProduct, brand, sessionId, hashtags } = ctx
        const session = ctx.cache.get<GenerationSession>(sessionId)
        const canSkip = session?.outlinePass
        if (canSkip) {
            yield { type: 'pass:skip', pass: 'outline' }
            return
        }
        yield { type: 'pass:start', pass: 'outline' }

        const brandContext = brand ?
            `Brand overview:${brand?.brandDescription}
            Brand voice:${JSON.stringify(brand?.brandVoice)}
            Content style:${brand?.contentStyle}
            Language:${brand?.language}
            Key value points:${brand?.keyPoints.join("\n- ")}
            CTA library:${brand?.ctaLibrary.join("\n- ")}
        `.trim() : ""
        const productBlock = selectedProduct
            ? `
            Product reference (optional):
            ${selectedProduct.name}
            The product may appear subtly within examples or context,
            without becoming the main focus or direct promotion.
            `
            : ""
        const prompt = `
            You are designing a CONTENT OUTLINE only. Do NOT write the full content.
            ${brandContext}
            ${session?.ideaPass?.selectedIdea ? `Core idea: ${session.ideaPass.selectedIdea}` : ""}
            ${session?.anglePass?.selectedAngle ? `Chosen angle: ${session.anglePass.selectedAngle}` : ""}
            ${productBlock}
            ${hashtags ? `Initial Hashtags: ${hashtags}` : ""}

            TASK:
            1. Generate ONE short, catchy content title (max 12 words)
            2. Create a logical outline as a SINGLE STRING with line breaks, following this structure:
                - Hook (what grabs attention)
                - Main points (2–3 key sections)
                - Soft CTA (implicit, non-promotional)
            3. Generate 3-5 relevant hashtags that:
                - Match the content topic and brand voice
                - Are specific and targeted to the audience
                - Include both broad and niche hashtags
                - Avoid overly generic or spammy tags

            RULES:
            - The title must NOT be repeated inside the outline
            - Outline must be a PLAIN TEXT STRING with line breaks (\\n), NOT a JSON object
            - Sections should describe PURPOSE, not full sentences
            - Do NOT write captions, hooks text, or CTA copy
            - No emojis, no markdown in sections
            - Hashtags should be an ARRAY of strings with # symbol
            - Each hashtag should be a single word without spaces
            - Hashtags MUST use plain ASCII characters

            Return ONLY valid JSON in EXACT format:
            {
              "title": "Your Title Here",
              "outline": "Hook: ...\nMain Point 1: ...\nMain Point 2: ...\nCTA: ...",
              "hashtags": ["#chuyendoiso", "#tudongbao", "#AI"]
            }
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
            console.error('[OutlinePass] JSON parse failed')
            console.error('[OutlinePass] Raw response:', response.content)
            console.error('[OutlinePass] Cleaned response:', clean)
            throw new Error('Outline pass returned invalid JSON')
        }

        console.log('[OutlinePass] Parsed JSON:', JSON.stringify(parsed, null, 2))

        let result: z.infer<typeof OutlinePassSchema>

        try {
            result = OutlinePassSchema.parse(parsed)
        } catch (err) {
            console.error('[OutlinePass] Schema validation failed')
            console.error('[OutlinePass] Parsed data:', JSON.stringify(parsed, null, 2))
            console.error('[OutlinePass] Validation errors:', err)

            // Try to recover if outline is an object
            if (typeof parsed === 'object' && parsed !== null && 'outline' in parsed) {
                const rawOutline = (parsed as any).outline
                if (typeof rawOutline === 'object') {
                    console.warn('[OutlinePass] outline is object, converting to string')
                    // Convert object outline to string
                    const outlineString = JSON.stringify(rawOutline, null, 2)
                    parsed = { ...parsed, outline: outlineString }
                    result = OutlinePassSchema.parse(parsed)
                } else {
                    throw err
                }
            } else {
                throw err
            }
        }

        // Normalize hashtags to space-separated string
        const normalizeHashtags = (hashtags: string | string[]): string => {
            console.log('[OutlinePass] Raw hashtags:', JSON.stringify(hashtags))
            console.log('[OutlinePass] Hashtags type:', Array.isArray(hashtags) ? 'array' : typeof hashtags)

            // Convert to array first
            let tags: string[]

            if (Array.isArray(hashtags)) {
                // Already an array
                tags = hashtags
                console.log('[OutlinePass] Using array:', tags)
            } else if (typeof hashtags === 'string') {
                // String - could be comma-separated or space-separated
                if (hashtags.includes(',')) {
                    tags = hashtags.split(',')
                    console.log('[OutlinePass] Split by comma:', tags)
                } else {
                    tags = hashtags.split(/\s+/)
                    console.log('[OutlinePass] Split by space:', tags)
                }
            } else {
                return ''
            }

            // Clean and normalize each tag
            const normalized = tags
                .map((tag: string) => tag.trim())
                .map((tag: string) => tag.replace(/\s+/g, '')) // Remove spaces within tag
                .map((tag: string) => tag.toLowerCase()) // ✅ Lowercase for consistency
                .filter((tag: string) => tag.length > 0) // Remove empty
                .join(' ') // Join with single space

            console.log('[OutlinePass] Normalized hashtags:', normalized)
            return normalized
        }

        // Normalize & safety guards
        const outline = {
            title: result.title?.trim() || session?.ideaPass?.selectedIdea || '',
            outline: result.outline.trim(),
            hashtags: normalizeHashtags(result.hashtags),
        }

        // Emit title ready event
        if (outline.title) {
            yield {
                type: 'title:ready',
                title: outline.title,
            }
        }

        // Emit hashtags ready event
        if (outline.hashtags) {
            yield {
                type: 'hashtags:ready',
                hashtags: outline.hashtags,
            }
        }

        ctx.cache.updateSession(ctx.sessionId, {
            outlinePass: outline,
        })

        yield { type: 'pass:complete', pass: 'outline' }
    }
}
