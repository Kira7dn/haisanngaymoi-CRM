import { Button } from '@shared/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import type { Post } from '@/core/domain/marketing/post'
import type { PostFormState } from './_hook/usePostFormState'
import type { AIGenerationViewModel, PlatformSelectorViewModel, QualityScoreViewModel } from './postForm.selectors'
import type { AIGenerationEvents, PlatformSelectorEvents } from './_hook/usePostFormMachine'

// Form events interface
export interface PostFormEvents {
  generateAI: () => void
  submit: () => void
  saveDraft: () => void
  delete: () => void
  close: () => void
  setField: <K extends keyof PostFormState>(key: K, value: PostFormState[K]) => void
}

// Extracted sections
import AIGenerationSection from './form-sections/AIGenerationSection'
import QualityScoreDisplay from './form-sections/QualityScoreDisplaySection'
import ContentInputFields from './form-sections/ContentInputSection'
import PlatformSelector from './form-sections/PlatformSelectorSection'
import MediaHashtagSchedule from './form-sections/MediaHashtagScheduleSection'

interface PostFormViewProps {
  // Data
  state: PostFormState
  post?: Post
  isVideoContent: boolean
  hasTextContent: boolean
  isDirty: boolean

  // State setters (for non-migrated sections)
  setField: <K extends keyof PostFormState>(key: K, value: PostFormState[K]) => void

  // Form events (NEW - unified event interface)
  events: PostFormEvents

  // Loading states (for non-migrated sections)
  isSubmitting: boolean

  // ViewModels (for migrated sections)
  aiGenerationViewModel: AIGenerationViewModel
  aiGenerationEvents: AIGenerationEvents
  platformSelectorViewModel: PlatformSelectorViewModel
  platformSelectorEvents: PlatformSelectorEvents
  qualityScoreViewModel: QualityScoreViewModel
}

/**
 * Pure presentational component for Post Form
 *
 * Responsibilities:
 * - Render UI based on props
 * - Forward user interactions to parent via callbacks
 * - No async logic, no side effects, no data fetching
 */
export default function PostFormView({
  state,
  post,
  isVideoContent,
  hasTextContent,
  isDirty,
  setField,
  events,
  isSubmitting,
  aiGenerationViewModel,
  aiGenerationEvents,
  platformSelectorViewModel,
  platformSelectorEvents,
  qualityScoreViewModel
}: PostFormViewProps) {

  const errors: Record<string, string> = {}
  if (state.platforms.length === 0) {
    errors.platforms = 'Please select at least one platform'
  }

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    events.submit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{post ? 'Edit Post' : 'Create New Post'}</h2>
        {isDirty && !post && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            • Unsaved changes
          </span>
        )}
      </div>

      {/* AI Generation Section - NEW ViewModel pattern */}
      <AIGenerationSection
        viewModel={aiGenerationViewModel}
        events={aiGenerationEvents}
      />

      {/* Quality Score Display */}
      <QualityScoreDisplay viewModel={qualityScoreViewModel} />

      {/* Content Input Fields */}
      <ContentInputFields
        title={state.title}
        setTitle={(value: string) => setField('title', value)}
        body={state.body}
        setBody={(value: string) => setField('body', value)}
        variations={state.variations}
        setVariations={(value: Array<{ title: string; content: string; style: string }>) => setField('variations', value)}
        idea={state.idea}
        setIdea={(value: string) => setField('idea', value)}
        contentInstruction={state.contentInstruction}
        setContentInstruction={(value: string) => setField('contentInstruction', value)}
        selectedProduct={state.product}
        setSelectedProduct={(value: any) => setField('product', value)}
        products={state.products}
      />

      {/* Platform Selector */}
      <PlatformSelector
        viewModel={platformSelectorViewModel}
        events={platformSelectorEvents}
      />

      {/* Media, Hashtags, Schedule */}
      <MediaHashtagSchedule
        media={state.media}
        setMedia={(value) => setField('media', value)}
        isVideoContent={isVideoContent}
        hashtags={state.hashtags}
        setHashtags={(value) => setField('hashtags', value)}
        scheduledAt={state.scheduledAt || ''}
        setScheduledAt={(value) => setField('scheduledAt', value)}
      />

      {/* Actions */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2">
          {post && (
            <Button
              type="button"
              variant="destructive"
              onClick={events.delete}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          )}
          {!post && (
            <Button
              type="button"
              variant="outline"
              onClick={events.saveDraft}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={events.close}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" /> Saving...
              </>
            ) : (
              post ? 'Update Post' : state.scheduledAt ? 'Schedule Post' : 'Publish Now'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
