import type { ActorRefFrom } from 'xstate'
import type { postFormMachine } from './postForm.machine'
import type { PostFormState } from './_hook/usePostFormState'
import { PostMedia } from '@/core/domain/marketing/post'

/**
 * PostForm Selectors
 *
 * Pure functions that transform machine state into ViewModels for UI sections.
 * This layer decouples UI components from XState implementation details.
 *
 * Pattern:
 * - Input: Machine snapshot + Form state
 * - Output: ViewModel (plain object)
 * - No side effects
 * - Easily testable
 */

// Type helper for machine snapshot
type MachineSnapshot = ReturnType<ActorRefFrom<typeof postFormMachine>['getSnapshot']>

// ========== ViewModels ==========

/**
 * ViewModel for AI Generation Section
 * Contains all data needed to render the AI generation UI
 */
export interface AIGenerationViewModel {
  // Generation settings
  mode: 'simple' | 'multi-pass'

  // Workflow state
  isGenerating: boolean
  isDisabled: boolean

  // Generation results
  progress: string[]
  similarityWarning: string | null

  // System capabilities
  hasBrandMemory: boolean

  // UI state
  showSettings: boolean
}

/**
 * ViewModel for Platform Selection Section
 */
export interface PlatformSelectorViewModel {
  contentType: string
  selectedPlatforms: string[]
  isDisabled: boolean
  primaryPlatform: string | undefined
  hasError: boolean
  errorMessage?: string
}

/**
 * ViewModel for Content Input Section
 */
export interface ContentInputViewModel {
  title: string
  body: string
  isDisabled: boolean
  hasContent: boolean
  variations: Array<{ title: string; content: string; style: string }>
}

/**
 * ViewModel for Quality Score Display
 */
export interface QualityScoreViewModel {
  score: number | null
  scoreBreakdown: Record<string, number> | null
  weaknesses: string[]
  suggestedFixes: string[]
  isVisible: boolean
}

/**
 * ViewModel for Media & Schedule Section
 */
export interface MediaScheduleViewModel {
  media?: PostMedia
  scheduledAt: string | undefined
  hashtags: string
  isDisabled: boolean
  isVideoContent: boolean
}

// ========== Selectors ==========

/**
 * Select AI Generation ViewModel
 *
 * @param machineState - Current machine snapshot
 * @param formState - Current form state
 * @returns ViewModel for AIGenerationSection
 */
export function selectAIGenerationViewModel(
  machineState: MachineSnapshot,
  formState: PostFormState
): AIGenerationViewModel {
  return {
    mode: formState.generationMode,
    isGenerating: machineState.matches('generating'),
    isDisabled: formState.platforms.length === 0,
    progress: formState.generationProgress,
    similarityWarning: formState.similarityWarning,
    hasBrandMemory: formState.hasBrandMemory,
    showSettings: formState.showSettings
  }
}

/**
 * Select Platform Selector ViewModel
 */
export function selectPlatformSelectorViewModel(
  machineState: MachineSnapshot,
  formState: PostFormState
): PlatformSelectorViewModel {
  const isDisabled =
    machineState.matches('generating') ||
    machineState.matches('submitting') ||
    machineState.matches('savingDraft')

  return {
    contentType: formState.contentType,
    selectedPlatforms: formState.platforms,
    isDisabled,
    primaryPlatform: formState.platforms[0],
    hasError: formState.platforms.length === 0,
    errorMessage: formState.platforms.length === 0 ? 'Please select at least one platform' : undefined
  }
}

/**
 * Select Content Input ViewModel
 */
export function selectContentInputViewModel(
  machineState: MachineSnapshot,
  formState: PostFormState
): ContentInputViewModel {
  const isDisabled =
    machineState.matches('generating') ||
    machineState.matches('submitting')

  const hasContent = Boolean(
    formState.title.trim() || formState.body.trim()
  )

  return {
    title: formState.title,
    body: formState.body,
    isDisabled,
    hasContent,
    variations: formState.variations
  }
}

/**
 * Select Quality Score ViewModel
 */
export function selectQualityScoreViewModel(
  machineState: MachineSnapshot,
  formState: PostFormState
): QualityScoreViewModel {
  const scoringData = formState.scoringData

  return {
    score: scoringData?.score ?? null,
    scoreBreakdown: scoringData?.scoreBreakdown ?? null,
    weaknesses: scoringData?.weaknesses ?? [],
    suggestedFixes: scoringData?.suggestedFixes ?? [],
    isVisible: scoringData !== null && scoringData.score !== undefined
  }
}

/**
 * Select Media & Schedule ViewModel
 */
export function selectMediaScheduleViewModel(
  machineState: MachineSnapshot,
  formState: PostFormState
): MediaScheduleViewModel {
  const isDisabled =
    machineState.matches('generating') ||
    machineState.matches('submitting')

  const isVideoContent = ['video', 'reel', 'short'].includes(formState.contentType)

  return {
    media: formState.media || undefined,
    scheduledAt: formState.scheduledAt,
    hashtags: formState.hashtags,
    isDisabled,
    isVideoContent
  }
}

// ========== Composite Selectors ==========

/**
 * Select all ViewModels at once (for performance optimization)
 * Use this when multiple sections need to update together
 */
export function selectAllViewModels(
  machineState: MachineSnapshot,
  formState: PostFormState
) {
  return {
    aiGeneration: selectAIGenerationViewModel(machineState, formState),
    platformSelector: selectPlatformSelectorViewModel(machineState, formState),
    contentInput: selectContentInputViewModel(machineState, formState),
    qualityScore: selectQualityScoreViewModel(machineState, formState),
    mediaSchedule: selectMediaScheduleViewModel(machineState, formState)
  }
}
