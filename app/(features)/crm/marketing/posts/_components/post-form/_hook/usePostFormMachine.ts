import { useEffect } from 'react'
import { useMachine } from '@xstate/react'
import { toast } from 'sonner'
import type { Post, Platform, ContentType } from '@/core/domain/marketing/post'
import { postFormMachine, type ToastMessage } from '../postForm.machine'
import { usePostFormActions, type AIGenerationResult, type SubmitMode } from './usePostFormActions'
import { PostFormState } from './usePostFormState'

type SetFieldFunction = <K extends keyof PostFormState>(key: K, value: PostFormState[K]) => void

interface UsePostFormMachineParams {
  state: PostFormState
  primaryPlatform?: Platform
  post?: Post
  onClose?: () => void
}

/**
 * usePostFormMachine Hook
 *
 * Connects XState machine with React components and side-effects:
 * - Manages workflow state transitions
 * - Executes async operations when entering states
 * - Handles toast notifications
 * - Triggers callbacks (onClose)
 *
 * Architecture:
 * ┌──────────────────────────────────────────┐
 * │ PostForm (UI)                            │
 * │  ├─ Dispatch events to machine           │
 * │  └─ Read machine state for rendering     │
 * └──────────────────────────────────────────┘
 *         │                    ▲
 *         ▼                    │
 * ┌──────────────────────────────────────────┐
 * │ usePostFormMachine (this hook)           │
 * │  ├─ State machine orchestration          │
 * │  ├─ Side-effect execution                │
 * │  └─ Toast notifications                  │
 * └──────────────────────────────────────────┘
 *         │                    ▲
 *         ▼                    │
 * ┌──────────────────────────────────────────┐
 * │ usePostFormActions                       │
 * │  ├─ generateAI()                         │
 * │  ├─ submitPost()                         │
 * │  └─ deletePost()                         │
 * └──────────────────────────────────────────┘
 */
export function usePostFormMachine({
  state,
  primaryPlatform,
  post,
  onClose
}: UsePostFormMachineParams) {

  // Initialize state machine
  const [machineState, send] = useMachine(postFormMachine, {
    input: {
      generatedData: null,
      submitResult: null,
      post,
      isDirty: false,
      hasTextContent: false,
      error: null,
      pendingToasts: []
    }
  })

  // Get async actions
  const {
    generateAI,
    submitPost,
    deletePost
  } = usePostFormActions({
    state,
    primaryPlatform,
    post
  })

  // ========== Side Effect: Handle Toasts ==========

  useEffect(() => {
    const toasts = machineState.context.pendingToasts

    if (toasts.length > 0) {
      toasts.forEach((toastMsg: ToastMessage) => {
        switch (toastMsg.type) {
          case 'success':
            toast.success(toastMsg.title, {
              description: toastMsg.description
            })
            break
          case 'error':
            toast.error(toastMsg.title, {
              description: toastMsg.description
            })
            break
          case 'info':
            toast.info(toastMsg.title, {
              description: toastMsg.description
            })
            break
        }
      })

      // Clear toast queue after showing
      send({ type: 'CANCEL' }) // Use a harmless event to trigger action
    }
  }, [machineState.context.pendingToasts])

  // ========== Side Effect: Execute Async Operations ==========

  // Handle AI Generation
  useEffect(() => {
    if (machineState.matches('generating')) {
      generateAI()
        .then((result: AIGenerationResult) => {
          send({ type: 'GENERATE_SUCCESS', data: result })
        })
        .catch((error: Error) => {
          send({ type: 'GENERATE_FAILURE', error: error.message })
        })
    }
  }, [machineState.value])

  // Handle Form Submission
  useEffect(() => {
    if (machineState.matches('submitting')) {
      const mode: SubmitMode = state.scheduledAt ? 'schedule' : 'publish'

      submitPost(mode)
        .then((result) => {
          send({ type: 'SUBMIT_SUCCESS', data: result })
        })
        .catch((error: Error) => {
          send({ type: 'SUBMIT_FAILURE', error: error.message })
        })
    }
  }, [machineState.value])

  // Handle Save Draft
  useEffect(() => {
    if (machineState.matches('savingDraft')) {
      submitPost('draft')
        .then((result) => {
          send({ type: 'SUBMIT_SUCCESS', data: result })
        })
        .catch((error: Error) => {
          send({ type: 'SUBMIT_FAILURE', error: error.message })
        })
    }
  }, [machineState.value])

  // Handle Delete
  useEffect(() => {
    if (machineState.matches('deleting')) {
      deletePost()
        .then(() => {
          send({ type: 'DELETE_SUCCESS' })
        })
        .catch((error: Error) => {
          send({ type: 'DELETE_FAILURE', error: error.message })
        })
    }
  }, [machineState.value])

  // ========== Side Effect: Handle Close Confirmation ==========

  useEffect(() => {
    if (machineState.matches('confirmingClose')) {
      const shouldSave = confirm('You have unsaved changes. Save as draft before closing?')
      if (shouldSave) {
        send({ type: 'CONFIRM_SAVE_DRAFT' })
      } else {
        send({ type: 'CONFIRM_DISCARD' })
      }
    }
  }, [machineState.value])

  // ========== Side Effect: Handle Delete Confirmation ==========

  useEffect(() => {
    if (machineState.matches('confirmingDelete')) {
      const shouldDelete = confirm('Bạn có chắc chắn muốn xóa post này?')
      if (shouldDelete) {
        send({ type: 'CONFIRM_DELETE' })
      } else {
        send({ type: 'CANCEL' })
      }
    }
  }, [machineState.value])

  // ========== Side Effect: Handle Success/Closed States ==========

  useEffect(() => {
    if (machineState.matches('success') || machineState.matches('deleted') || machineState.matches('closed')) {
      onClose?.()
    }
  }, [machineState.value, onClose])

  // ========== Side Effect: Update Generated Data in State ==========

  useEffect(() => {
    const generatedData = machineState.context.generatedData
    if (generatedData && machineState.matches('generated')) {
      // This will be handled in PostForm controller
      // We expose it via return value
    }
  }, [machineState.context.generatedData, machineState.value])

  // ========== Return Machine State & Controls ==========

  return {
    // Machine state (for debugging)
    machineState,
    send,

    // Computed states for UI
    isIdle: machineState.matches('idle'),
    isEditing: machineState.matches('editing'),
    isGenerating: machineState.matches('generating'),
    isGenerated: machineState.matches('generated'),
    isSubmitting: machineState.matches('submitting') || machineState.matches('savingDraft'),
    isDeleting: machineState.matches('deleting'),
    isConfirmingClose: machineState.matches('confirmingClose'),
    isConfirmingDelete: machineState.matches('confirmingDelete'),
    isSuccess: machineState.matches('success'),
    isDeleted: machineState.matches('deleted'),
    isClosed: machineState.matches('closed'),

    // Context data
    generatedData: machineState.context.generatedData,
    submitResult: machineState.context.submitResult,
    error: machineState.context.error,

    // Helper methods
    canGenerate: machineState.can({ type: 'GENERATE_REQUEST' }),
    canSubmit: machineState.can({ type: 'SUBMIT_REQUEST', mode: 'publish' }),
    canSaveDraft: machineState.can({ type: 'SAVE_DRAFT_REQUEST' }),
    canDelete: machineState.can({ type: 'DELETE_REQUEST' }),
    canClose: machineState.can({ type: 'CLOSE_REQUEST' })
  }
}

// ========== Event Creators ==========

/**
 * Event creators for form sections
 * These wrap machine events with semantic names for UI components
 */
export interface AIGenerationEvents {
  onGenerate: () => void
  onToggleSettings: () => void
  onChangeMode: (mode: 'simple' | 'multi-pass') => void
}

export interface PlatformSelectorEvents {
  onTogglePlatform: (platform: Platform) => void
  onSetPlatforms: (platforms: Platform[]) => void
  onChangeContentType: (contentType: ContentType) => void
}

export interface ContentInputEvents {
  onChangeTitle: (title: string) => void
  onChangeBody: (body: string) => void
  onSelectVariation: (variation: { title: string; content: string }) => void
}

export interface MediaScheduleEvents {
  onUploadMedia: (file: File) => void
  onRemoveMedia: () => void
  onChangeHashtags: (hashtags: string) => void
  onSchedule: (date: Date) => void
  onClearSchedule: () => void
}

/**
 * Create event handlers for AI Generation section
 */
export function createAIGenerationEvents(
  send: (event: any) => void,
  setField: SetFieldFunction
): AIGenerationEvents {
  return {
    onGenerate: () => send({ type: 'GENERATE_REQUEST' }),
    onToggleSettings: () => setField('showSettings', true), // Toggle via form state
    onChangeMode: (mode) => setField('generationMode', mode)
  }
}

/**
 * Create event handlers for Platform Selector section
 */
export function createPlatformSelectorEvents(
  setField: SetFieldFunction
): PlatformSelectorEvents {
  return {
    onTogglePlatform: (_platform: Platform) => {
      // TODO: Implement platform toggle logic in component
    },
    onSetPlatforms: (platforms) => setField('platforms', platforms),
    onChangeContentType: (contentType) => setField('contentType', contentType)
  }
}

/**
 * Create event handlers for Content Input section
 */
export function createContentInputEvents(
  setField: SetFieldFunction,
  updateMultipleFields: (updates: any) => void
): ContentInputEvents {
  return {
    onChangeTitle: (title) => setField('title', title),
    onChangeBody: (body) => setField('body', body),
    onSelectVariation: (variation) => {
      updateMultipleFields({
        title: variation.title,
        body: variation.content
      })
    }
  }
}

/**
 * Create event handlers for Media & Schedule section
 */
export function createMediaScheduleEvents(
  setField: SetFieldFunction
): MediaScheduleEvents {
  return {
    onUploadMedia: (_file: File) => {
      // TODO: Implement media upload logic in component
    },
    onRemoveMedia: () => setField('media', null),
    onChangeHashtags: (hashtags) => setField('hashtags', hashtags),
    onSchedule: (date) => setField('scheduledAt', date.toISOString()),
    onClearSchedule: () => setField('scheduledAt', undefined)
  }
}
