'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Post } from '@/core/domain/marketing/post'
import type { PostFormState } from './_hook/usePostFormState'
import type {
  AIGenerationViewModel,
  PlatformSelectorViewModel,
  QualityScoreViewModel
} from './postForm.selectors'
import type {
  AIGenerationEvents,
  PlatformSelectorEvents
} from './_hook/usePostFormMachine'

// ========== Context Types ==========

export interface PostFormEvents {
  generateAI: () => void
  submit: () => void
  saveDraft: () => void
  delete: () => void
  close: () => void
  setField: <K extends keyof PostFormState>(key: K, value: PostFormState[K]) => void
}

interface PostFormContextValue {
  // Data
  state: PostFormState
  post?: Post
  isVideoContent: boolean
  hasTextContent: boolean
  isDirty: boolean

  // Events
  events: PostFormEvents

  // Loading states
  isSubmitting: boolean

  // ViewModels
  aiGenerationViewModel: AIGenerationViewModel
  aiGenerationEvents: AIGenerationEvents
  platformSelectorViewModel: PlatformSelectorViewModel
  platformSelectorEvents: PlatformSelectorEvents
  qualityScoreViewModel: QualityScoreViewModel
}

// ========== Context ==========

const PostFormContext = createContext<PostFormContextValue | null>(null)

// ========== Provider ==========

interface PostFormProviderProps {
  children: ReactNode
  value: PostFormContextValue
}

export function PostFormProvider({ children, value }: PostFormProviderProps) {
  return (
    <PostFormContext.Provider value={value}>
      {children}
    </PostFormContext.Provider>
  )
}

// ========== Hooks ==========

export function usePostFormContext() {
  const context = useContext(PostFormContext)
  if (!context) {
    throw new Error('usePostFormContext must be used within PostFormProvider')
  }
  return context
}

// Granular hooks for specific data
export function usePostFormState() {
  const { state } = usePostFormContext()
  return state
}

export function usePostFormEvents() {
  const { events } = usePostFormContext()
  return events
}

export function usePostFormData() {
  const { state, post, isVideoContent, hasTextContent, isDirty } = usePostFormContext()
  return { state, post, isVideoContent, hasTextContent, isDirty }
}

export function usePostFormLoadingStates() {
  const { isSubmitting } = usePostFormContext()
  return { isSubmitting }
}

export function usePostFormViewModels() {
  const {
    aiGenerationViewModel,
    aiGenerationEvents,
    platformSelectorViewModel,
    platformSelectorEvents,
    qualityScoreViewModel
  } = usePostFormContext()

  return {
    aiGenerationViewModel,
    aiGenerationEvents,
    platformSelectorViewModel,
    platformSelectorEvents,
    qualityScoreViewModel
  }
}
