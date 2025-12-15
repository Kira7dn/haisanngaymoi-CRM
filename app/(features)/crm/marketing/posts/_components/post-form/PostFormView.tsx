import { Button } from '@shared/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import {
  usePostFormData,
  usePostFormEvents,
  usePostFormLoadingStates,
  usePostFormViewModels
} from './PostFormContext'

// Extracted sections
import AIGenerationSection from './form-sections/AIGenerationSection'
import QualityScoreDisplay from './form-sections/QualityScoreDisplaySection'
import ContentInputSection from './form-sections/ContentInputSection'
import PlatformSelector from './form-sections/PlatformSelectorSection'
import MediaHashtagScheduleSection from './form-sections/MediaHashtagScheduleSection'

/**
 * Pure presentational component for Post Form
 *
 * Responsibilities:
 * - Render UI based on context data (zero props!)
 * - Forward user interactions to parent via event callbacks
 * - No async logic, no side effects, no data fetching
 */
export default function PostFormView() {
  // Get data from context - no props needed!
  const { state, post, isDirty } = usePostFormData()
  const events = usePostFormEvents()
  const { isSubmitting } = usePostFormLoadingStates()
  const {
    aiGenerationViewModel,
    aiGenerationEvents,
    platformSelectorViewModel,
    platformSelectorEvents,
    qualityScoreViewModel
  } = usePostFormViewModels()

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

      {/* Content Input Fields - Now uses Context! */}
      <ContentInputSection />

      {/* Platform Selector */}
      <PlatformSelector
        viewModel={platformSelectorViewModel}
        events={platformSelectorEvents}
      />

      {/* Media, Hashtags, Schedule - Now uses Context! */}
      <MediaHashtagScheduleSection />

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
