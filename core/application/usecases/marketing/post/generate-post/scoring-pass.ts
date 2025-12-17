import { ILLMService } from "@/core/application/interfaces/marketing/post-gen-service"
import { MultiPassGenRequest } from "../gen-multi-pass"
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

export async function scoringPass(
  llm: ILLMService,
  request: MultiPassGenRequest,
  brandContext: string,
  content: string
): Promise<{ score: number; scoreBreakdown: any; weaknesses: string[], suggestedFixes: string[] }> {

  const scoringPrompt = `Score this content for quality:
    Content: ${content}
    Brand context: ${brandContext}
    Platform: ${request.platform || 'social media'}

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

  const scoringResponse = await llm.generateCompletion({
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
    return ScoringPassSchema.parse(parsed)
  } catch (error) {
    console.error('[Multi-Pass] Failed to parse scoring response:', cleanScoring)
    throw new Error(`Invalid JSON response from scoring pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export class ScoringPass implements GenerationPass {
  readonly name: PassType = 'scoring'

  canSkip(session: any): boolean {
    return Boolean(session.scoringPass)
  }

  async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
    const session = ctx.cache.get(ctx.sessionId)

    const content = session.enhancePass?.enhanced ?? session.draftPass?.draft
    if (!content) {
      throw new Error('Scoring pass requires draft or enhance pass to be completed first')
    }

    yield { type: 'pass:start', pass: 'scoring' }

    const scoringPrompt = `Score this content for quality:
      Content: ${content}
      Brand context: ${ctx.brandContext}
      Platform: ${ctx.request.platform || 'social media'}

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