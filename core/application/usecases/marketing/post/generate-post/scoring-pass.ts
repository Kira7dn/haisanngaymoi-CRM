import { GenerationSession, ILLMService } from "@/core/application/interfaces/marketing/post-gen-service"
import { z } from "zod"
import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass"

const ScoringPassSchema = z.object({
  score: z.number(),
  scoreBreakdown: z.object({
    clarity: z.number(),
    engagement: z.number(),
    brandVoice: z.number(),
    platformFit: z.number(),
    safety: z.number(),
  }),
  weaknesses: z.array(z.string()),
  suggestedFixes: z.array(z.string()),
})

export class ScoringPass implements GenerationPass {
  readonly name: PassType = 'scoring'

  async *execute(ctx: PassContext, session: GenerationSession): AsyncGenerator<GenerationEvent> {
    const { title, body, hashtags, brand } = ctx;
    const content = body || session.enhancePass?.enhanced || session.draftPass?.draft
    const canSkip = !content
    if (canSkip) {
      yield { type: 'pass:skip', pass: 'scoring' }
      return
    }

    yield { type: 'pass:start', pass: 'scoring' }

    const brandContext = brand ?
      `Brand overview:${brand?.brandDescription}
            Brand voice:${JSON.stringify(brand?.brandVoice)}
            Content style:${brand?.contentStyle}
            Language:${brand?.language}
            Key value points:${brand?.keyPoints.join("\n- ")}
            CTA library:${brand?.ctaLibrary.join("\n- ")}
        `.trim() : ""

    const scoringPrompt = `Score this content for quality:
      Content: ${content}
      ${brandContext ? `Brand context: ${brandContext}` : 'No brand context'}
      Score each criterion (0-20):
      1. Clarity: Is the message clear and easy to understand?
      2. Engagement: Will it capture audience attention?
      3. Brand Voice: Does it match the brand tone and style?
      4. Platform Fit: Is it optimized for the target platform?
      5. Safety: Does it avoid spam, fake claims, or inappropriate content?

      Return ONLY valid JSON (no markdown):
      {
        "score": number (sum of all, 0-100),
        "scoreBreakdown": {
          "clarity": number,
          "engagement": number,
          "brandVoice": number,
          "platformFit": number,
          "safety": number
        },
        "weaknesses": ["weakness 1", "weakness 2"],
        "suggestedFixes": ["suggested improvement 1", "suggested improvement 2"]
      }
    `

    const scoringResponse = await ctx.llm.generateCompletion({
      systemPrompt: "You are a content quality analyst. Return valid JSON only. Never use markdown code blocks.",
      prompt: scoringPrompt,
      temperature: 0.1,
      maxTokens: 500,
    })

    let cleanScoring = scoringResponse.content.trim()
    if (cleanScoring.startsWith('```')) {
      cleanScoring = cleanScoring.replace(/```(json)?\n?/g, '').trim()
    }

    try {
      const parsed = JSON.parse(cleanScoring)
      console.log('[Multi-Pass] Scoring parsed:', parsed)
      const scoring = ScoringPassSchema.parse(parsed)

      ctx.cache.updateSession(ctx.sessionId, {
        scoringPass: {
          score: scoring.score,
          scoreBreakdown: scoring.scoreBreakdown,
          weaknesses: scoring.weaknesses,
          suggestedFixes: scoring.suggestedFixes,
        },
      })
    } catch (error) {
      console.error('[Multi-Pass] Failed to parse scoring response:', cleanScoring)
      // Don't throw - scoring is optional, continue without it
      console.warn('[Multi-Pass] Scoring pass failed, continuing without scoring')
    }

    yield { type: 'pass:complete', pass: 'scoring' }
  }
}