import { GenerationSession } from "@/core/application/usecases/marketing/post/generate-post/post-gen-service.interfaces"
import { z } from "zod"
import { GenerationEvent, GenerationPass, PassContext, PassType } from "../stream-post-generationn"

const Schema = z.object({
    title: z.string(),
    outline: z.string(),
    hashtags: z.array(z.string()),
})

const normTags = (v?: string[] | string) =>
    Array.from(new Set(
        (Array.isArray(v) ? v : v?.split(/[,\s]+/) ?? [])
            .map(t => t.trim().replace(/\s+/g, "").toLowerCase())
            .filter(Boolean)
    )).join(" ")

export class OutlinePass implements GenerationPass {
    name: PassType = "outline"

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const { idea, sessionId, hasChange, hashtags } = ctx
        const session = await ctx.cache.get<GenerationSession>(sessionId)
        if (!idea || (session?.outlinePass && !hasChange)) {
            yield { type: "pass:skip", pass: "outline" }
            return
        }

        yield { type: "pass:start", pass: "outline" }
        const prompt = `
            You are designing a CONTENT OUTLINE only. Do NOT write the full content.
            Core idea: ${session?.ideaPass?.selectedIdea || idea}
            ${session?.anglePass?.selectedAngle ? `Chosen angle: ${session.anglePass.selectedAngle}` : "Angle: "}
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
        const res = await ctx.llm.generateCompletion({
            systemPrompt: "Return ONLY valid JSON.",
            prompt,
            temperature: 0.6,
            maxTokens: 500,
        })

        const raw = res.content.replace(/```json|```/gi, "").trim()
        let data = JSON.parse(raw)
        if (typeof data.outline === "object")
            data.outline = JSON.stringify(data.outline)

        const r = Schema.parse(data)

        const outline = {
            title: r.title.trim() || session?.ideaPass?.selectedIdea || "",
            outline: r.outline.trim(),
            hashtags: normTags(r.hashtags),
        }

        if (outline.title) {
            yield { type: "title:ready", title: outline.title }
        }
        if (outline.hashtags) {
            yield { type: "hashtags:ready", hashtags: outline.hashtags }
        }

        await ctx.cache.updateSession(sessionId, { outlinePass: outline })
        yield { type: "pass:complete", pass: "outline" }
    }
}
