'use client'

import { Label } from '@shared/ui/label'
import { usePostFormContext } from '../PostFormContext'
import PlatformMultiSelect from './PlatformMultiSelect'

/**
 * PlatformSelectorSection - Simplified platform selection
 *
 * Changes from v1:
 * - Removed content type selector (auto-detected from media upload)
 * - Removed platform button grid (replaced with multi-select dropdown)
 * - Now only displays platform selection with compatibility filtering
 *
 * Features:
 * - Shows current content type for context
 * - Multi-select dropdown with search
 * - Selected platforms displayed as badges
 * - Validation error display
 */
export default function PlatformSelectorSection() {
  const { state, setField } = usePostFormContext()
  const { contentType, platforms } = state

  const hasError = platforms.length === 0
  const errorMessage = "Please select at least one platform"

  return (
    <section className="space-y-3">
      <div>
        <Label>Target Platforms *</Label>
        <p className="text-sm text-muted-foreground">
          Platforms compatible with <span className="font-medium capitalize">{contentType}</span> content
        </p>
      </div>

      {/* Multi-Select Dropdown */}
      <PlatformMultiSelect
        contentType={contentType}
        selectedPlatforms={platforms}
        onPlatformsChange={(platforms) => setField('platforms', platforms)}
      />

      {/* Error Message */}
      {hasError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </section>
  )
}
