import { z } from "zod"
import { ILLMService } from "@/core/application/interfaces/marketing/post-gen-service"
import { BrandMemoryService } from "@/core/application/interfaces/brand-memory-service"
import type { BrandMemory } from "@/core/domain/brand-memory"

const ResponseSchema = z.object({
  title: z.string(),
  body: z.string(),
  hashtags: z.array(z.string()),
  variations: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      style: z.string(),
    })
  ),
})

export interface SinglePassGenRequest {
  topic?: string
  idea?: string // NEW: Post idea from schedule
  productUrl?: string // NEW: Product URL for context
  detailInstruction?: string // NEW: Specific instructions for this post
}

export interface SinglePassGenResponse {
  title: string
  body: string
  hashtags: string[]
  variations: Array<{
    title: string
    body: string
    style: string
  }>
}

export class SinglePassGenUseCase {
  constructor(
    private readonly llmService: ILLMService,
    private readonly brandMemoryRepo: BrandMemoryService,
  ) { }

  async execute(params: SinglePassGenRequest): Promise<SinglePassGenResponse> {
    // Get brand memory from repository
    const brandMemory = await this.brandMemoryRepo.get()
    const settings = this.buildSettings(brandMemory)

    // Build prompt (business logic) - UPDATED with new fields
    const prompt = `Generate social media post content:

Product: ${settings.brandDescription}
Style: ${settings.contentStyle}
Language: ${settings.language}
${params.topic ? `Topic: ${params.topic}` : ""}
${params.idea ? `Post Idea: ${params.idea}` : ""}
${params.productUrl ? `Product URL for reference: ${params.productUrl}` : ""}
${params.detailInstruction ? `Specific Instructions: ${params.detailInstruction}` : ""}

Generate:
1. One main post title (10-200 characters)
2. One main post content (50-3000 characters)
3. Three variations with different styles (professional, casual, promotional)

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "title": "string",
  "body": "string",
  "hashtags": ["string"],
  "variations": [
    { "title": "string", "body": "string", "style": "professional" },
    { "title": "string", "body": "string", "style": "casual" },
    { "title": "string", "body": "string", "style": "promotional" }
  ]
}`

    // Call generic AI adapter
    const response = await this.llmService.generateCompletion({
      systemPrompt: "You are a professional social media content creator. Always respond with valid JSON only.",
      prompt: prompt,
      temperature: 0.8,
      maxTokens: 1000,
    })

    // Parse and validate
    const parsed = ResponseSchema.parse(JSON.parse(response.content))

    return parsed
  }

  private buildSettings(brandMemory?: BrandMemory | null) {
    if (!brandMemory) {
      return {
        brandDescription: "Premium fresh seafood from Cô Tô Island, delivered daily",
        contentStyle: "professional",
        language: "vietnamese",
      }
    }

    return {
      brandDescription: brandMemory.brandDescription,
      contentStyle: brandMemory.contentStyle,
      language: brandMemory.language,
    }
  }
}
