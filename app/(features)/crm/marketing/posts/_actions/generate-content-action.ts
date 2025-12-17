"use server"
import { createCheckContentSimilarityUseCase, createStoreContentEmbeddingUseCase } from "@/app/api/content-memory/depends"
import { SinglePassGenRequest, SinglePassGenResponse } from "@/core/application/usecases/marketing/post/generate-post/generate-post-single-pass"
import { MultiPassGenRequest, MultiPassGenResponse, GenerationEvent } from "@/core/application/usecases/marketing/post/generate-post/stream-gen-multi-pass"
import { createSinglePassGenUseCase, createStreamMultiPassUseCase } from "@/app/api/posts/gen-content/depends"

export async function singlePassGenAction(params: SinglePassGenRequest): Promise<{
  success: boolean; content?: SinglePassGenResponse; error?: string;
}> {
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

/**
 * Generate post content with multi-pass approach (STREAMING)
 * Streams generation events in real-time for live UI updates
 */
export async function* streamMultiPassAction(
  params: MultiPassGenRequest
): AsyncGenerator<GenerationEvent> {
  try {
    const useCase = await createStreamMultiPassUseCase()

    for await (const event of useCase.execute({
      ...params,
    })) {
      yield event
    }
  } catch (error) {
    console.error("Failed to generate multi-pass streaming content:", error)
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    }
  }
}