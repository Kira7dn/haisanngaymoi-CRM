'use client'

import { memo, useState } from 'react'
import { scoringGeneration, streamMultiPassGeneration } from '../actions/stream-generate-action'
import { usePostFormContext } from '../PostFormContext'
import { usePostSettingStore } from '../../../_store/usePostSettingStore'
import { Loader2, BarChart3, Lightbulb, X, Sparkles } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Textarea } from '@shared/ui/textarea'

/**
 * Quality Score Constants
 * ✅ OPTIMIZATION: Extract magic numbers
 */
const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  NEEDS_IMPROVEMENT: 0
} as const

const BREAKDOWN_THRESHOLDS = {
  EXCELLENT: 16,
  GOOD: 12,
  NEEDS_IMPROVEMENT: 0
} as const

const SCORE_LABELS = {
  clarity: 'Clarity',
  engagement: 'Engagement',
  brandVoice: 'Brand Voice',
  platformFit: 'Platform Fit',
  safety: 'Safety'
} as const

/**
 * Score data interface matching the streaming response
 */
interface ScoreData {
  score: number
  scoreBreakdown: {
    clarity: number
    engagement: number
    brandVoice: number
    platformFit: number
    safety: number
  }
  weaknesses: string[]
  suggestedFixes: string[]
}

/**
 * QualityScoreDisplaySection - Displays AI-generated quality scores
 *
 * This component triggers the multi-pass generation when content is ready
 * and displays the scoring results in real-time.
 */
function QualityScoreDisplaySection() {
  const { state, setField, updateMultipleFields } = usePostFormContext()
  const { brand } = usePostSettingStore()
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UX states for improve flow
  const [showImproveSection, setShowImproveSection] = useState(false)
  const [improveInstruction, setImproveInstruction] = useState('')
  const [isImproving, setIsImproving] = useState(false)

  // Check if we have content to score
  const hasContent = Boolean(state.body || state.title)

  // Manual scoring function
  const handleScoreContent = async () => {
    if (!hasContent) return

    setIsScoring(true)
    setError(null)
    setScoreData(null)
    setShowImproveSection(false) // Close improve section when re-scoring

    try {
      const sessionId = `score-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`

      const events = await scoringGeneration({
        ...state,
        brand,
        sessionId,
      })

      for (const event of events) {
        if (event.type === 'final' && event.result?.metadata) {
          const {
            score,
            scoreBreakdown,
            weaknesses,
            suggestedFixes,
          } = event.result.metadata

          if (score && scoreBreakdown) {
            setScoreData({
              score,
              scoreBreakdown,
              weaknesses: weaknesses ?? [],
              suggestedFixes: suggestedFixes ?? [],
            })
          }
        } else if (event.type === 'error') {
          setError(event.message)
          break
        }
      }
    } catch (err) {
      console.error('Scoring failed:', err)
      setError('Failed to score content. Please try again.')
    } finally {
      setIsScoring(false)
    }
  }

  // Open improve section with pre-filled suggestions
  const handleOpenImprove = () => {
    if (!scoreData || scoreData.suggestedFixes.length === 0) return

    // Format suggestions as numbered list
    const formattedSuggestions = scoreData.suggestedFixes
      .map((fix, idx) => `${idx + 1}. ${fix}`)
      .join('\n')

    setImproveInstruction(formattedSuggestions)
    setShowImproveSection(true)
  }

  // Cancel improve flow
  const handleCancelImprove = () => {
    setShowImproveSection(false)
    setImproveInstruction('')
  }

  // Submit improve request to AI
  const handleSubmitImprove = async () => {
    if (!improveInstruction.trim()) return

    setIsImproving(true)
    setError(null)

    try {
      const sessionId = `improve-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`

      // Call AI to improve content based on instructions
      const events = await streamMultiPassGeneration({
        ...state,
        contentInstruction: improveInstruction,
        brand,
        sessionId,
      })

      let improvedTitle = ''
      let improvedBody = ''

      for await (const event of events) {
        if (event.type === 'final' && event.result) {
          if (event.result.title) improvedTitle = event.result.title
          if (event.result.body) improvedBody = event.result.body
        } else if (event.type === 'error') {
          setError(event.message)
          break
        }
      }

      // Update form with improved content
      if (improvedTitle || improvedBody) {
        updateMultipleFields({
          title: improvedTitle || state.title,
          body: improvedBody || state.body,
        })

        // Close improve section and clear instruction
        setShowImproveSection(false)
        setImproveInstruction('')

        // Automatically re-score the improved content
        setTimeout(() => handleScoreContent(), 500)
      }
    } catch (err) {
      console.error('Improve failed:', err)
      setError('Failed to improve content. Please try again.')
    } finally {
      setIsImproving(false)
    }
  }


  // Don't show anything if no content
  if (!hasContent) {
    return null
  }

  // Show score button if no score data yet
  if (!scoreData && !isScoring) {
    return (
      <div className="border rounded-lg p-4 bg-linear-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              AI Quality Score
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analyze your content quality across 5 criteria
            </p>
          </div>
          <Button
            type="button"
            onClick={handleScoreContent}
            variant="default"
            size="sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Score Content
          </Button>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isScoring) {
    return (
      <div className="border rounded-lg p-4 bg-linear-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing content quality...</span>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  // Don't show if no score data yet
  if (!scoreData) {
    return null
  }

  // ✅ OPTIMIZATION: Pure functions for style calculations
  const getScoreLabel = (score: number): string => {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'Excellent'
    if (score >= SCORE_THRESHOLDS.GOOD) return 'Good'
    return 'Needs Improvement'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    }
    if (score >= SCORE_THRESHOLDS.GOOD) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
    }
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
  }

  const getBarColor = (value: number): string => {
    if (value >= BREAKDOWN_THRESHOLDS.EXCELLENT) return 'bg-green-500'
    if (value >= BREAKDOWN_THRESHOLDS.GOOD) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getBreakdownLabel = (key: string): string => {
    if (key in SCORE_LABELS) {
      return SCORE_LABELS[key as keyof typeof SCORE_LABELS]
    }
    return key.charAt(0).toUpperCase() + key.slice(1)
  }

  const scoreLabel = getScoreLabel(scoreData.score)
  const scoreBgColor = getScoreBgColor(scoreData.score)

  return (
    <div className="border rounded-lg p-4 bg-linear-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-lg">AI Quality Score: {scoreData.score}/100</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${scoreBgColor}`}>
            {scoreLabel}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleOpenImprove}
            variant="default"
            size="sm"
            disabled={!scoreData.suggestedFixes || scoreData.suggestedFixes.length === 0 || showImproveSection}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Improve
          </Button>
          <Button
            type="button"
            onClick={handleScoreContent}
            variant="outline"
            size="sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Re-score
          </Button>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(scoreData.scoreBreakdown).map(([key, value]) => {
          const barColor = getBarColor(value)
          const label = getBreakdownLabel(key)

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

      {/* Weaknesses */}
      {scoreData.weaknesses.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-sm text-red-700 dark:text-red-300 mb-2">
            ⚠️ Areas for Improvement:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {scoreData.weaknesses.map((weakness, idx) => (
              <li key={idx}>{weakness}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Fixes */}
      {scoreData.suggestedFixes.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-2">
            💡 Suggested Improvements:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {scoreData.suggestedFixes.map((fix, idx) => (
              <li key={idx}>{fix}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Improve Section - Expandable */}
      {showImproveSection && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Customize Improvement Instructions
            </h4>
            <Button
              type="button"
              onClick={handleCancelImprove}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            value={improveInstruction}
            onChange={(e) => setImproveInstruction(e.target.value)}
            placeholder="Edit or add improvement instructions..."
            className="min-h-[120px] text-sm"
            disabled={isImproving}
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI will regenerate your content based on these instructions
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleCancelImprove}
                variant="outline"
                size="sm"
                disabled={isImproving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitImprove}
                variant="default"
                size="sm"
                disabled={!improveInstruction.trim() || isImproving}
              >
                {isImproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Submit Improve
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ✅ OPTIMIZATION: Export memoized component
 * Only re-renders when viewModel changes
 */
export default memo(QualityScoreDisplaySection)
