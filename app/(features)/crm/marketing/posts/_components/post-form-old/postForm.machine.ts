import { assign, setup } from 'xstate'
import type { Post } from '@/core/domain/marketing/post'
import type { AIGenerationResult, SubmitPostResult, SubmitMode } from './_hook/usePostFormActions'

/**
 * PostForm State Machine
 *
 * Handles complete workflow lifecycle including:
 * - Form editing
 * - AI generation with similarity check
 * - Multi-pass generation progress
 * - Form submission (draft/schedule/publish)
 * - Post deletion
 * - Unsaved changes handling
 */

// ========== Context Types ==========

export interface PostFormMachineContext {
  // Generated data
  generatedData: AIGenerationResult | null
  submitResult: SubmitPostResult | null

  // Metadata
  post?: Post
  isDirty: boolean
  hasTextContent: boolean

  // Error handling
  error: string | null

  // Toast messages (for side-effects)
  pendingToasts: ToastMessage[]
}

export interface ToastMessage {
  type: 'success' | 'error' | 'info'
  title: string
  description?: string
}

// ========== Event Types ==========

export type PostFormMachineEvent =
  // User interactions
  | { type: 'EDIT'; isDirty: boolean; hasTextContent: boolean }
  | { type: 'FORM_UPDATED'; isDirty: boolean; hasTextContent: boolean; primaryPlatform?: string }
  | { type: 'GENERATE_REQUEST' }
  | { type: 'SUBMIT_REQUEST'; mode: SubmitMode }
  | { type: 'SAVE_DRAFT_REQUEST' }
  | { type: 'DELETE_REQUEST' }
  | { type: 'CLOSE_REQUEST' }

  // Action results
  | { type: 'GENERATE_SUCCESS'; data: AIGenerationResult }
  | { type: 'GENERATE_FAILURE'; error: string }
  | { type: 'SUBMIT_SUCCESS'; data: SubmitPostResult }
  | { type: 'SUBMIT_FAILURE'; error: string }
  | { type: 'DELETE_SUCCESS' }
  | { type: 'DELETE_FAILURE'; error: string }

  // User confirmations
  | { type: 'CONFIRM_SAVE_DRAFT' }
  | { type: 'CONFIRM_DISCARD' }
  | { type: 'CONFIRM_DELETE' }
  | { type: 'CANCEL' }

// ========== State Machine ==========

export const postFormMachine = setup({
  types: {
    context: {} as PostFormMachineContext,
    events: {} as PostFormMachineEvent,
  },

  actions: {
    // ========== Context Updates ==========

    setDirtyState: assign({
      isDirty: ({ event }) => {
        if (event.type === 'EDIT') return event.isDirty
        return false
      },
      hasTextContent: ({ event }) => {
        if (event.type === 'EDIT') return event.hasTextContent
        return false
      }
    }),

    storeGeneratedData: assign({
      generatedData: ({ event }) => {
        if (event.type === 'GENERATE_SUCCESS') return event.data
        return null
      },
      error: null
    }),

    storeSubmitResult: assign({
      submitResult: ({ event }) => {
        if (event.type === 'SUBMIT_SUCCESS') return event.data
        return null
      },
      error: null,
      isDirty: false
    }),

    storeError: assign({
      error: ({ event }) => {
        if (
          event.type === 'GENERATE_FAILURE' ||
          event.type === 'SUBMIT_FAILURE' ||
          event.type === 'DELETE_FAILURE'
        ) {
          return event.error
        }
        return null
      }
    }),

    clearError: assign({ error: null }),

    resetDirtyState: assign({
      isDirty: false,
      hasTextContent: false
    }),

    // ========== Toast Queue Management ==========

    queueGenerationSuccessToast: assign({
      pendingToasts: ({ context, event }) => {
        if (event.type !== 'GENERATE_SUCCESS') return context.pendingToasts

        const data = event.data
        const scoreInfo = data.score?.score
          ? ` | Quality Score: ${data.score.score}/100`
          : ''

        const message: ToastMessage = {
          type: 'success',
          title: 'High-quality content generated',
          description: data.similarityCheck?.isSimilar
            ? '⚠️ Warning: Similar to existing content'
            : `Generated successfully${scoreInfo}`
        }

        return [...context.pendingToasts, message]
      }
    }),

    queueGenerationErrorToast: assign({
      pendingToasts: ({ context, event }) => {
        if (event.type !== 'GENERATE_FAILURE') return context.pendingToasts

        return [...context.pendingToasts, {
          type: 'error',
          title: 'Failed to generate content',
          description: event.error
        }]
      }
    }),

    queueSubmitSuccessToast: assign({
      pendingToasts: ({ context, event }) => {
        if (event.type !== 'SUBMIT_SUCCESS') return context.pendingToasts

        const toasts: ToastMessage[] = []
        const result = event.data

        // Platform-specific results
        if (result.platformResults) {
          const successfulPlatforms = result.platformResults.filter(r => r.success)
          const failedPlatforms = result.platformResults.filter(r => !r.success)

          successfulPlatforms.forEach(platform => {
            toasts.push({
              type: 'success',
              title: `Published to ${platform.platform}`,
              description: platform.permalink
                ? `View post: ${platform.permalink}`
                : 'Post published successfully'
            })
          })

          failedPlatforms.forEach(platform => {
            toasts.push({
              type: 'error',
              title: `Failed to publish to ${platform.platform}`,
              description: platform.error || 'Unknown error occurred'
            })
          })

          if (result.platformResults.length > 1) {
            toasts.push({
              type: 'info',
              title: 'Publishing Summary',
              description: `${successfulPlatforms.length} succeeded, ${failedPlatforms.length} failed`
            })
          }
        } else {
          // Simple success
          toasts.push({
            type: 'success',
            title: context.post ? 'Post updated successfully' : 'Post created successfully'
          })
        }

        return [...context.pendingToasts, ...toasts]
      }
    }),

    queueSubmitErrorToast: assign({
      pendingToasts: ({ context, event }) => {
        if (event.type !== 'SUBMIT_FAILURE') return context.pendingToasts

        return [...context.pendingToasts, {
          type: 'error',
          title: 'Failed to save post',
          description: event.error
        }]
      }
    }),

    queueDraftSavedToast: assign({
      pendingToasts: ({ context }) => [
        ...context.pendingToasts,
        {
          type: 'success',
          title: 'Draft saved successfully',
          description: 'You can continue editing later'
        }
      ]
    }),

    queueDeleteSuccessToast: assign({
      pendingToasts: ({ context }) => [
        ...context.pendingToasts,
        {
          type: 'success',
          title: 'Post đã được xóa thành công'
        }
      ]
    }),

    queueDeleteErrorToast: assign({
      pendingToasts: ({ context, event }) => {
        if (event.type !== 'DELETE_FAILURE') return context.pendingToasts

        return [...context.pendingToasts, {
          type: 'error',
          title: 'Không thể xóa post',
          description: event.error
        }]
      }
    }),

    clearToastQueue: assign({
      pendingToasts: []
    })
  },

  guards: {
    hasUnsavedChanges: ({ context }) => {
      return !context.post && context.isDirty && context.hasTextContent
    },

    isEditingExistingPost: ({ context }) => {
      return !!context.post
    }
  }

}).createMachine({
  id: 'postForm',

  initial: 'idle',

  context: {
    generatedData: null,
    submitResult: null,
    post: undefined,
    isDirty: false,
    hasTextContent: false,
    error: null,
    pendingToasts: []
  },

  states: {
    // ========== Main States ==========

    idle: {
      on: {
        EDIT: {
          target: 'editing',
          actions: ['setDirtyState']
        },
        GENERATE_REQUEST: 'generating',
        SUBMIT_REQUEST: 'submitting',
        SAVE_DRAFT_REQUEST: 'savingDraft',
        DELETE_REQUEST: 'confirmingDelete',
        CLOSE_REQUEST: [
          {
            guard: 'hasUnsavedChanges',
            target: 'confirmingClose'
          },
          {
            target: 'closed'
          }
        ]
      }
    },

    editing: {
      on: {
        EDIT: {
          target: 'editing',
          actions: ['setDirtyState'],
          reenter: true
        },
        GENERATE_REQUEST: 'generating',
        SUBMIT_REQUEST: 'submitting',
        SAVE_DRAFT_REQUEST: 'savingDraft',
        DELETE_REQUEST: 'confirmingDelete',
        CLOSE_REQUEST: [
          {
            guard: 'hasUnsavedChanges',
            target: 'confirmingClose'
          },
          {
            target: 'closed'
          }
        ]
      }
    },

    generating: {
      on: {
        GENERATE_SUCCESS: {
          target: 'generated',
          actions: ['storeGeneratedData', 'queueGenerationSuccessToast']
        },
        GENERATE_FAILURE: {
          target: 'editing',
          actions: ['storeError', 'queueGenerationErrorToast']
        }
      }
    },

    generated: {
      on: {
        EDIT: {
          target: 'editing',
          actions: ['setDirtyState']
        },
        GENERATE_REQUEST: 'generating',
        SUBMIT_REQUEST: 'submitting',
        SAVE_DRAFT_REQUEST: 'savingDraft',
        DELETE_REQUEST: 'confirmingDelete',
        CLOSE_REQUEST: [
          {
            guard: 'hasUnsavedChanges',
            target: 'confirmingClose'
          },
          {
            target: 'closed'
          }
        ]
      }
    },

    submitting: {
      on: {
        SUBMIT_SUCCESS: {
          target: 'success',
          actions: ['storeSubmitResult', 'queueSubmitSuccessToast']
        },
        SUBMIT_FAILURE: {
          target: 'editing',
          actions: ['storeError', 'queueSubmitErrorToast']
        }
      }
    },

    savingDraft: {
      on: {
        SUBMIT_SUCCESS: {
          target: 'success',
          actions: ['storeSubmitResult', 'queueDraftSavedToast']
        },
        SUBMIT_FAILURE: {
          target: 'editing',
          actions: ['storeError', 'queueSubmitErrorToast']
        }
      }
    },

    success: {
      type: 'final',
      entry: ['resetDirtyState']
    },

    // ========== Confirmation Dialogs ==========

    confirmingClose: {
      on: {
        CONFIRM_SAVE_DRAFT: 'savingDraft',
        CONFIRM_DISCARD: 'closed',
        CANCEL: 'editing'
      }
    },

    confirmingDelete: {
      on: {
        CONFIRM_DELETE: 'deleting',
        CANCEL: 'editing'
      }
    },

    deleting: {
      on: {
        DELETE_SUCCESS: {
          target: 'deleted',
          actions: ['queueDeleteSuccessToast']
        },
        DELETE_FAILURE: {
          target: 'editing',
          actions: ['storeError', 'queueDeleteErrorToast']
        }
      }
    },

    deleted: {
      type: 'final'
    },

    closed: {
      type: 'final'
    }
  }
})
