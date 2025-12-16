"use server"

import { createSinglePassGenUseCase, createGeneratePostMultiPassUseCase } from "@/app/api/content-generation/depends"
import { getBrandMemoryAction } from "./brand-memory-action"
import { createCheckContentSimilarityUseCase, createStoreContentEmbeddingUseCase } from "@/app/api/content-memory/depends"

export async function SinglePassGenAction(params: {
  topic?: string
  platform?: string
  idea?: string // NEW
  productUrl?: string // NEW
  detailInstruction?: string // NEW
}) {
  try {
    const useCase = await createSinglePassGenUseCase()
    const result = await useCase.execute(params)
    return { success: true, content: result }
  } catch (error) {
    console.error("Failed to generate content:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Generate post content with multi-pass approach
 * Uses episodic memory to store intermediate results
 */
export async function generatePostMultiPassAction(params: {
  topic?: string
  platform?: string
  sessionId?: string
  idea?: string // NEW
  productUrl?: string // NEW
  detailInstruction?: string // NEW
}) {
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

    return {
      success: true,
      title: result.title,
      content: result.content,
      sessionId: result.sessionId,
      metadata: result.metadata,
    }
  } catch (error) {
    console.error("Failed to generate multi-pass content:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Check content similarity before generation
 */
export async function checkContentSimilarityAction(params: {
  content: string
  title?: string
  platform?: string
  similarityThreshold?: number
}) {
  try {
    const useCase = await createCheckContentSimilarityUseCase()
    const result = await useCase.execute(params)
    return { success: true, ...result }
  } catch (error) {
    console.error("Failed to check content similarity:", error)
    // Return non-similar result on error to allow content creation
    return {
      success: false,
      isSimilar: false,
      maxSimilarity: 0,
      similarContent: [],
      error: String(error)
    }
  }
}


/**
 * Store content embedding after post creation
 */
export async function storeContentEmbeddingAction(params: {
  postId: string
  content: string
  title?: string
  platform?: string
  topic?: string
}) {
  try {
    const useCase = await createStoreContentEmbeddingUseCase()
    const result = await useCase.execute(params)
    return { success: true, embeddingId: result.embeddingId }
  } catch (error) {
    console.error("Failed to store content embedding:", error)
    // Don't fail the whole operation if embedding storage fails
    return { success: false, error: String(error) }
  }
}