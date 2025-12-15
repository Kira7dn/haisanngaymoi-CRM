import { Platform, Post } from "@/core/domain/marketing/post"
import { updatePostAction } from "../../../_actions/update-post-action"
import { createPostAction } from "../../../_actions/create-post-action"
import { PostFormState } from "./usePostFormState"
import { checkContentSimilarityAction, generatePostContentAction, generatePostMultiPassAction } from "../../../_actions/generate-content-action"
import { deletePostAction } from "../../../_actions/delete-post-action"

// Helper function to parse hashtags
const parseHashtags = (hashtagsStr: string): string[] => {
  return hashtagsStr
    .split(/\s+/)
    .filter(tag => tag.startsWith("#"))
    .map(tag => tag.slice(1))
}

interface UsePostFormActionsParams {
  state: PostFormState
  primaryPlatform?: Platform
  post?: Post
}

/**
 * Result types for PostForm actions
 *
 * Actions ONLY return data, never mutate state directly
 * Loading states are now managed by XState machine
 */

export interface AIGenerationResult {
  title: string
  body: string
  score?: {
    score?: number
    scoreBreakdown?: Record<string, number>
    weaknesses?: string[]
    suggestedFixes?: string[]
  }
  progress?: string[]
  variations?: Array<{ title: string; content: string; style: string }>
  similarityCheck?: {
    isSimilar: boolean
    warning?: string
  }
}

export interface SimilarityCheckResult {
  isSimilar: boolean
  warning?: string
  maxSimilarity?: number
}

export interface SubmitPostResult {
  success: boolean
  postId?: string
  platformResults?: Array<{
    platform: string
    success: boolean
    permalink?: string
    error?: string
  }>
}

export type SubmitMode = 'draft' | 'schedule' | 'publish'

/**
 * usePostFormActions - Pure async operations
 *
 * Returns functions that perform async operations and return results.
 * NO loading state management (handled by XState machine).
 * NO side effects (toasts, navigation, etc.).
 */
export function usePostFormActions({
  state,
  primaryPlatform,
  post
}: UsePostFormActionsParams) {

  // ========== Pure Functions (no side effects) ==========

  /**
   * Check content similarity
   * Returns result, does NOT mutate state
   */
  const checkSimilarity = async (
    content: string,
    title: string
  ): Promise<SimilarityCheckResult> => {
    if (!primaryPlatform) {
      throw new Error('At least one platform is required')
    }

    try {
      const result = await checkContentSimilarityAction({
        content,
        title,
        platform: primaryPlatform,
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

  /**
   * Generate AI content
   * Returns complete result for Controller to handle
   */
  const generateAI = async (): Promise<AIGenerationResult> => {
    if (!primaryPlatform) {
      throw new Error('Please select a platform first')
    }

    if (state.generationMode === 'multi-pass') {
      const result = await generatePostMultiPassAction({
        topic: state.title || state.idea || undefined,
        platform: primaryPlatform,
        idea: state.idea || undefined,
        productUrl: state.product?.url,
        detailInstruction: state.contentInstruction || undefined
      })

      if (!result.success) {
        throw new Error(result.error || 'Generation failed')
      }

      // Check similarity
      const similarityCheck = await checkSimilarity(
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
    } else {
      // Simple single-pass generation
      const result = await generatePostContentAction({
        topic: state.title || state.idea || undefined,
        platform: primaryPlatform,
        idea: state.idea || undefined,
        productUrl: state.product?.url,
        detailInstruction: state.contentInstruction || undefined
      })

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Generation failed')
      }

      const similarityCheck = await checkSimilarity(
        result.content.content,
        result.content.title
      )

      return {
        title: result.content.title,
        body: result.content.content,
        variations: result.content.variations,
        similarityCheck
      }
    }
  }

  /**
   * Submit post (create or update)
   * Returns result for Controller to handle
   */
  const submitPost = async (mode: SubmitMode): Promise<SubmitPostResult> => {
    if (mode !== 'draft' && state.platforms.length === 0) {
      throw new Error('Please select at least one platform')
    }

    if (post?.id) {
      // Update existing post
      await updatePostAction({
        postId: post.id,
        payload: {
          title: state.title,
          body: state.body,
          contentType: state.contentType,
          platforms: state.platforms,
          media: state.media || undefined,
          hashtags: parseHashtags(state.hashtags),
          scheduledAt: state.scheduledAt
        }
      })

      return {
        success: true,
        postId: post.id
      }
    } else {
      // Create new post
      const result = await createPostAction({
        mode,
        payload: {
          title: state.title,
          body: state.body,
          contentType: state.contentType,
          platforms: state.platforms,
          media: state.media || undefined,
          hashtags: parseHashtags(state.hashtags),
          scheduledAt: state.scheduledAt
        }
      })

      return {
        success: true,
        postId: result.postId
      }
    }
  }

  /**
   * Delete post
   * Note: Confirmation now handled by XState machine
   */
  const deletePost = async (): Promise<void> => {
    if (!post?.id) {
      throw new Error('No post to delete')
    }

    await deletePostAction(post.id)
  }

  return {
    // Actions (return results, no side effects)
    generateAI,
    submitPost,
    deletePost,
    checkSimilarity
  }
}
