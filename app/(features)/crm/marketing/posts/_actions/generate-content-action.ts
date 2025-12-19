"use server"
import { createCheckContentSimilarityUseCase } from "@/app/api/content-memory/depends"
import { SinglePassGenRequest, SinglePassGenResponse } from "@/core/application/usecases/marketing/post/generate-post/generate-post-single-pass"
import { createSinglePassGenUseCase,  } from "@/app/api/posts/gen-content/depends"

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