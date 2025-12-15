'use client'

import { useEffect, useMemo, useCallback } from 'react'
import type { Post } from '@/core/domain/marketing/post'
import { usePostFormState } from './_hook/usePostFormState'
import { usePostFormInitialData } from './_hook/usePostFormInitialData'
import { usePostFormMachine } from './_hook/usePostFormMachine'
import { selectAIGenerationViewModel, selectPlatformSelectorViewModel, selectQualityScoreViewModel } from './postForm.selectors'
import { PostFormProvider } from './PostFormContext'
import PostFormView from './PostFormView'

interface PostFormProps {
  post?: Post
  onClose?: () => void
  initialScheduledAt?: Date
  initialIdea?: string
  registerHandleClose?: (handler: () => Promise<void>) => void
}

/**
 * PostForm Controller - OPTIMIZED VERSION
 *
 * Key Optimizations:
 * 1. ✅ Memoized Context value
 * 2. ✅ Stable event creators with useCallback
 * 3. ✅ Reduced dependency arrays
 * 4. ✅ Selective re-render triggers
 */
export default function PostFormOptimized({
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
  }, [isBootstrapping, products, hasBrandMemory, updateMultipleFields])

  // ========== State Machine ==========
  const {
    send,
    machineState,
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
  }, [generatedData, updateMultipleFields])

  // ========== Sync Form → Machine ==========
  useEffect(() => {
    send({
      type: 'FORM_UPDATED',
      isDirty,
      hasTextContent,
      primaryPlatform,
    })
  }, [isDirty, hasTextContent, primaryPlatform, send])

  // ========== ViewModels & Event Creators (OPTIMIZED) ==========

  // ✅ OPTIMIZATION 1: Memoize ViewModels with proper dependencies
  const aiGenerationViewModel = useMemo(
    () => selectAIGenerationViewModel(machineState, state),
    [
      // ✅ Only depend on specific fields that affect this ViewModel
      machineState.value,
      state.generationMode,
      state.platforms.length,
      state.generationProgress,
      state.similarityWarning,
      state.hasBrandMemory,
      state.showSettings
    ]
  )

  const platformSelectorViewModel = useMemo(
    () => selectPlatformSelectorViewModel(machineState, state),
    [
      machineState.value,
      state.contentType,
      state.platforms
    ]
  )

  const qualityScoreViewModel = useMemo(
    () => selectQualityScoreViewModel(machineState, state),
    [
      machineState.value,
      state.scoringData
    ]
  )

  // ✅ OPTIMIZATION 2: Stable Event Creators using useCallback
  const aiGenerationEvents = useMemo(
    () => ({
      onGenerate: () => send({ type: 'GENERATE_REQUEST' }),
      onToggleSettings: () => setField('showSettings', !state.showSettings),
      onChangeMode: (mode: 'simple' | 'multi-pass') => setField('generationMode', mode)
    }),
    [send, setField, state.showSettings]
  )

  const platformSelectorEvents = useMemo(
    () => ({
      onTogglePlatform: (platform: any) => {
        const isSelected = state.platforms.includes(platform)
        const newPlatforms = isSelected
          ? state.platforms.filter(p => p !== platform)
          : [...state.platforms, platform]
        setField('platforms', newPlatforms)
      },
      onSetPlatforms: (platforms: any[]) => setField('platforms', platforms),
      onChangeContentType: (contentType: any) => setField('contentType', contentType)
    }),
    [setField, state.platforms]
  )

  // ✅ OPTIMIZATION 3: Stable formEvents with useCallback
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
  }, [registerHandleClose, send])

  // ========== Render ==========
  if (isBootstrapping) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-sm text-gray-500">Loading form...</div>
      </div>
    )
  }

  // ✅ OPTIMIZATION 4: Memoize Context Value
  const contextValue = useMemo(
    () => ({
      state,
      post,
      isVideoContent,
      hasTextContent,
      isDirty,
      events: formEvents,
      isSubmitting: isSubmitting || isDeleting,
      aiGenerationViewModel,
      aiGenerationEvents,
      platformSelectorViewModel,
      platformSelectorEvents,
      qualityScoreViewModel
    }),
    [
      state,
      post,
      isVideoContent,
      hasTextContent,
      isDirty,
      formEvents,
      isSubmitting,
      isDeleting,
      aiGenerationViewModel,
      aiGenerationEvents,
      platformSelectorViewModel,
      platformSelectorEvents,
      qualityScoreViewModel
    ]
  )

  return (
    <PostFormProvider value={contextValue}>
      <PostFormView />
    </PostFormProvider>
  )
}
