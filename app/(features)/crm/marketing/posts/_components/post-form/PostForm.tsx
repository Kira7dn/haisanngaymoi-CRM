'use client'

import { useEffect, useMemo } from 'react'
import type { Post } from '@/core/domain/marketing/post'
import { usePostFormState } from './_hook/usePostFormState'
import { usePostFormInitialData } from './_hook/usePostFormInitialData'
import { usePostFormMachine, createAIGenerationEvents, createPlatformSelectorEvents } from './_hook/usePostFormMachine'
import { selectAIGenerationViewModel, selectPlatformSelectorViewModel, selectQualityScoreViewModel } from './postForm.selectors'
import PostFormView from './PostFormView'


interface PostFormProps {
  post?: Post
  onClose?: () => void
  initialScheduledAt?: Date
  initialIdea?: string
  registerHandleClose?: (handler: () => Promise<void>) => void
}

/**
 * PostForm - STATE MACHINE Controller
 *
 * Architecture:
 * ┌─────────────────────────────────────────────┐
 * │ PostForm (Controller)                       │
 * │  ├─ Wire state machine                      │
 * │  ├─ Dispatch events to machine              │
 * │  ├─ Update form state from machine context  │
 * │  └─ Delegate rendering to View              │
 * └─────────────────────────────────────────────┘
 *         ▼                    ▼
 *   usePostFormState    usePostFormMachine
 *   (form data)         (workflow state)
 *                             │
 *                             ▼
 *                       XState Machine
 *                       (orchestration + side-effects)
 */
export default function PostForm({
  post,
  onClose,
  initialScheduledAt,
  initialIdea,
  registerHandleClose
}: PostFormProps) {

  // ========== Bootstrap: Load initial data ==========
  const { products, hasBrandMemory, isLoading: isBootstrapping } = usePostFormInitialData()

  // ========== Form State Management ==========
  const {
    state,
    setField,
    updateMultipleFields,
    primaryPlatform,
    hasTextContent,
    isVideoContent,
    isDirty
  } = usePostFormState({
    post,
    initialIdea,
    initialScheduledAt
  })

  // Sync initial data into state when loaded
  useEffect(() => {
    if (!isBootstrapping) {
      updateMultipleFields({
        products,
        hasBrandMemory
      })
    }
  }, [isBootstrapping, products, hasBrandMemory])

  // ========== State Machine ==========
  const {
    send,
    machineState,
    isGenerating,
    isSubmitting,
    isDeleting,
    generatedData
  } = usePostFormMachine({
    state,
    primaryPlatform,
    post,
    onClose
  })

  // ========== Sync Generated Data to Form State ==========
  useEffect(() => {
    if (!generatedData) return
    updateMultipleFields({
      title: generatedData.title,
      body: generatedData.body,
      scoringData: generatedData.score ?? null,
      generationProgress: generatedData.progress ?? [],
      variations: generatedData.variations ?? [],
      similarityWarning: generatedData.similarityCheck?.warning ?? null,
    })
  }, [generatedData])

  // ========== Sync Form → Machine ==========
  useEffect(() => {
    send({
      type: 'FORM_UPDATED',
      isDirty,
      hasTextContent,
      primaryPlatform,
    })
  }, [isDirty, hasTextContent, primaryPlatform])

  // ========== ViewModels & Event Creators ==========

  // Create ViewModels using selectors
  const aiGenerationViewModel = useMemo(
    () => selectAIGenerationViewModel(machineState, state),
    [machineState, state]
  )

  const platformSelectorViewModel = useMemo(
    () => selectPlatformSelectorViewModel(machineState, state),
    [machineState, state]
  )

  const qualityScoreViewModel = useMemo(
    () => selectQualityScoreViewModel(machineState, state),
    [machineState, state]
  )

  // Create Event Handlers
  const aiGenerationEvents = useMemo(
    () => createAIGenerationEvents(send, setField),
    [send, setField]
  )

  const platformSelectorEvents = useMemo(
    () => createPlatformSelectorEvents(setField),
    [setField]
  )

  // ========== Intent Events ==========
  const formEvents = useMemo(
    () => ({
      generateAI: () => send({ type: 'GENERATE_REQUEST' }),
      submit: () => {
        const mode = state.scheduledAt ? 'schedule' : 'publish'
        send({ type: 'SUBMIT_REQUEST', mode })
      },
      saveDraft: () => send({ type: 'SAVE_DRAFT_REQUEST' }),
      delete: () => send({ type: 'DELETE_REQUEST' }),
      close: () => send({ type: 'CLOSE_REQUEST' }),
      setField,
    }),
    [send, setField, state.scheduledAt]
  )

  // ========== Register Close Handler ==========
  useEffect(() => {
    if (!registerHandleClose) return
    registerHandleClose(async () => {
      send({ type: 'CLOSE_REQUEST' })
    })
  }, [registerHandleClose])

  // ========== Render ==========
  if (isBootstrapping) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-sm text-gray-500">Loading form...</div>
      </div>
    )
  }

  return (
    <PostFormView
      state={state}
      post={post}
      isVideoContent={isVideoContent}
      hasTextContent={hasTextContent}
      isDirty={isDirty}
      setField={setField}
      events={formEvents}
      isSubmitting={isSubmitting || isDeleting}
      aiGenerationViewModel={aiGenerationViewModel}
      aiGenerationEvents={aiGenerationEvents}
      platformSelectorViewModel={platformSelectorViewModel}
      platformSelectorEvents={platformSelectorEvents}
      qualityScoreViewModel={qualityScoreViewModel}
    />
  )
}
