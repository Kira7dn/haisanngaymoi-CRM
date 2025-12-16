import { Product } from "@/core/domain/catalog/product"
import { checkContentSimilarityAction, generatePostMultiPassAction } from "../../../_actions/generate-content-action"
import { createSinglePassGenUseCase } from "@/app/api/content-generation/depends"
import { SinglePassGenRequest, SinglePassGenResponse } from "@/core/application/usecases/marketing/post/generate-post-single-pass"
import { GeneratePostMultiPassResponse } from "@/core/application/usecases/marketing/post/generate-post-multi-pass"

// ---------- types ----------
// PostFormActions.ts
export interface AIGenerateActions {
  singlePassGenerate: () => Promise<SinglePassGenResponse>
  multiPassGenerate: () => Promise<void>
  checkSimilarity: () => Promise<void>
}

export interface SimilarityCheckResult {
  isSimilar: boolean
  warning?: string
  maxSimilarity?: number
}

export interface AIGenerateProps {
  topic: string
  idea: string
  product: Product
  detailInstruction: string
}

export function AIGenerateAction({
  topic,
  idea,
  product,
  detailInstruction,
}: AIGenerateProps): AIGenerateActions {

  const checkSimilarity = async (
    content: string,
    title: string
  ): Promise<SimilarityCheckResult> => {
    try {
      const result = await checkContentSimilarityAction({
        content,
        title,
        similarityThreshold: 0.85
      })

      if (result.success && result.isSimilar) {
        return {
          isSimilar: true,
          warning: 'warning' in result ? result.warning : 'Content is similar to existing posts',
          maxSimilarity: result.maxSimilarity
        }
      }

      return { isSimilar: false }
    } catch (error) {
      console.error('Similarity check failed:', error)
      return { isSimilar: false }
    }
  }

  const singlePassGenerate = async (): Promise<SinglePassGenResponse> => {
    const params: SinglePassGenRequest = {
      topic,
      idea,
      productUrl: product.url,
      detailInstruction
    }
    try {
      const useCase = await createSinglePassGenUseCase()
      const result = await useCase.execute(params)

      // Check similarity
      const similarityCheck = await checkContentSimilarityAction(
        result.body || '',
        result.title || '',
      )

      // Build progress messages
      const progress = result.metadata?.passesCompleted
        ? result.metadata.passesCompleted.map(pass =>
          `✓ ${pass.charAt(0).toUpperCase() + pass.slice(1)} pass completed`
        )
        : undefined

      // Return RESULT only
      return {
        title: result.title || '',
        body: result.content || '',
        score: result.metadata?.score ? {
          score: result.metadata.score,
          scoreBreakdown: result.metadata.scoreBreakdown,
          weaknesses: result.metadata.weaknesses,
          suggestedFixes: result.metadata.suggestedFixes
        } : undefined,
        progress,
        similarityCheck
      }
    }
    catch (error) {
      console.error('Single-pass generation failed:', error)
      return { isSimilar: false }
    }
  }

  const multiPassGenerate = async (): Promise<GeneratePostMultiPassResponse> => {
    try {
      // Get brand memory
      const brandMemoryResult = await getBrandMemoryAction()
      const brandMemory = brandMemoryResult.success ? brandMemoryResult.brandMemory : undefined

      // Execute multi-pass generation
      const useCase = await createGeneratePostMultiPassUseCase()
      const result = await useCase.execute({
        topic: params.topic,
        platform: params.platform,
        sessionId: params.sessionId,
        idea: params.idea, // NEW
        productUrl: params.productUrl, // NEW
        detailInstruction: params.detailInstruction, // NEW
        brandMemory: brandMemory ? {
          brandDescription: brandMemory.brandDescription, // FIXED: was productDescription
          contentStyle: brandMemory.contentStyle,
          language: brandMemory.language,
          brandVoice: brandMemory.brandVoice,
          keyPoints: brandMemory.keyPoints,
        } : undefined,
      })

      // Check similarity
      const similarityCheck = await checkContentSimilarityAction(
        result.content || '',
        result.title || ''
      )

      // Build progress messages
      const progress = result.metadata?.passesCompleted
        ? result.metadata.passesCompleted.map(pass =>
          `✓ ${pass.charAt(0).toUpperCase() + pass.slice(1)} pass completed`
        )
        : undefined

      // Return RESULT only
      return {
        title: result.title || '',
        body: result.content || '',
        score: result.metadata?.score ? {
          score: result.metadata.score,
          scoreBreakdown: result.metadata.scoreBreakdown,
          weaknesses: result.metadata.weaknesses,
          suggestedFixes: result.metadata.suggestedFixes
        } : undefined,
        progress,
        similarityCheck
      }
    }
    catch (error) {
      console.error('Multi-pass generation failed:', error)
      return { isSimilar: false }
    }
  }
  return {
    checkSimilarity,
    singlePassGenerate,
    multiPassGenerate
  }
}