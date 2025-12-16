'use client'

import { memo } from 'react'
import type { QualityScoreViewModel } from '../postForm.selectors'

/**
 * QualityScoreDisplaySection Props
 *
 * Standard ViewModel pattern (read-only, no events)
 */
export interface QualityScoreDisplaySectionProps {
  viewModel: QualityScoreViewModel
}

/**
 * QualityScoreDisplaySection - Pure UI Component (Optimized)
 *
 * Responsibilities:
 * - Display AI-generated quality score
 * - Show score breakdown by category
 * - Highlight weaknesses and suggested fixes
 *
 * Does NOT:
 * - Modify any state
 * - Handle user interactions (read-only display)
 * - Know about workflow or machine
 *
 * ✅ OPTIMIZATION: Wrapped with React.memo to prevent unnecessary re-renders
 */
function QualityScoreDisplaySection({
  viewModel
}: QualityScoreDisplaySectionProps) {
  const { score, scoreBreakdown, weaknesses, suggestedFixes, isVisible } = viewModel

  if (!isVisible) {
    return null
  }

  const scoreLabel =
    score && score >= 80 ? 'Excellent' :
    score && score >= 60 ? 'Good' :
    'Needs Improvement'

  const scoreBgColor =
    score && score >= 80
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      : score && score >= 60
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'

  return (
    <div className="border rounded-lg p-4 bg-linear-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">AI Quality Score: {score}/100</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${scoreBgColor}`}>
          {scoreLabel}
        </div>
      </div>

      {/* Score Breakdown */}
      {scoreBreakdown && (
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(scoreBreakdown).map(([key, value]) => {
            const barColor =
              value >= 16 ? 'bg-green-500' :
              value >= 12 ? 'bg-yellow-500' :
              'bg-red-500'

            const label =
              key === 'brandVoice' ? 'Brand Voice' :
              key === 'platformFit' ? 'Platform Fit' :
              key.charAt(0).toUpperCase() + key.slice(1)

            return (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {value}/20
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 capitalize mt-1">
                  {label}
                </div>
                <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${(value / 20) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-sm text-red-700 dark:text-red-300 mb-2">
            ⚠️ Areas for Improvement:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {weaknesses.map((weakness, idx) => (
              <li key={idx}>{weakness}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Fixes */}
      {suggestedFixes.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-2">
            💡 Suggested Improvements:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {suggestedFixes.map((fix, idx) => (
              <li key={idx}>{fix}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ✅ OPTIMIZATION: Export memoized component
export default memo(QualityScoreDisplaySection)
