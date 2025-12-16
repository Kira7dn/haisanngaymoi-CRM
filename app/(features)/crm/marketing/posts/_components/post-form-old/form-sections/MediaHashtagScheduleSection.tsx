'use client'

import { memo, useCallback, ChangeEvent } from 'react'
import { Label } from '@shared/ui/label'
import { Input } from '@shared/ui/input'
import { MediaUpload } from '@/app/(features)/crm/_components/MediaUpload'
import {
  usePostFormState,
  usePostFormEvents,
  usePostFormData
} from '../PostFormContext'

/**
 * MediaHashtagScheduleSection - Optimized with React.memo & useCallback
 *
 * ✅ OPTIMIZATIONS:
 * 1. Wrapped with React.memo
 * 2. useCallback for event handlers
 */
function MediaHashtagScheduleSection() {
  const state = usePostFormState()
  const events = usePostFormEvents()
  const { isVideoContent } = usePostFormData()

  // ✅ OPTIMIZATION: Memoize event handlers
  const handleMediaChange = useCallback((url: string | null) => {
    events.setField('media', url ? { type: isVideoContent ? 'video' : 'image', url } : null)
  }, [isVideoContent, events])

  const handleHashtagsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    events.setField('hashtags', e.target.value)
  }, [events])

  const handleScheduledAtChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    events.setField('scheduledAt', e.target.value)
  }, [events])

  return (
    <>
      {/* Media */}
      <div>
        <Label>Media</Label>
        <MediaUpload
          value={state.media?.url}
          onChange={handleMediaChange}
          folder="posts"
          type={isVideoContent ? "video" : "image"}
          maxSize={isVideoContent ? 500 : 10}
        />
      </div>

      {/* Hashtags */}
      <div>
        <Label htmlFor="hashtags">Hashtags (space-separated)</Label>
        <Input
          id="hashtags"
          value={state.hashtags}
          onChange={handleHashtagsChange}
        />
      </div>

      {/* Schedule */}
      <div>
        <Label htmlFor="scheduledAt">Schedule (optional)</Label>
        <Input
          type="datetime-local"
          id="scheduledAt"
          value={state.scheduledAt || ''}
          onChange={handleScheduledAtChange}
        />
      </div>
    </>
  )
}

// ✅ OPTIMIZATION: Export memoized component
export default memo(MediaHashtagScheduleSection)
