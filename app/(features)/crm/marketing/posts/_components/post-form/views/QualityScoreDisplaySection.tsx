'use client'

import { memo, useState } from 'react'
import { BarChart3, Lightbulb, X, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Textarea } from '@shared/ui/textarea'
import { usePostFormContext } from '../PostFormContext'
import { usePostSettingStore } from '../../../_store/usePostSettingStore'
import { streamMultiPassGeneration } from '../actions/stream-generate-action'
import { handleStreamEvents, generateSessionId } from './stream-event-handler'
import { scrollBodyTextareaToBottom } from './utils'
import {
  type ScoreData,
  getScoreLabel,
  getScoreBadgeClass,
  getBreakdownBarClass,
  getBreakdownLabel,
  formatSuggestionsAsText,
} from './score-utils'
import { AlertBox, LoadingState, SectionContainer } from './shared-ui'

/**
 * QualityScoreDisplaySection - AI-powered content quality analysis
 *
 * Features:
 * - Real-time quality scoring across 5 criteria
 * - Detailed weakness analysis
 * - AI-powered content improvement suggestions
 * - One-click content enhancement
 */
function QualityScoreDisplaySection() {
  const { state, setField } = usePostFormContext()
  const { brand } = usePostSettingStore()

  // Score state
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Improve flow state
  const [improveInstruction, setImproveInstruction] = useState('')
  const [isImproving, setIsImproving] = useState(false)
  const [progress, setProgress] = useState<string[]>([])

  const hasContent = Boolean(state.body || state.title)

  /**
   * Score the current content
   */
  const handleScoreContent = async () => {
    if (!hasContent) return

    setIsScoring(true)
    setError(null)
    setScoreData(null)

    try {
      const events = await streamMultiPassGeneration({
        ...state,
        brand,
        sessionId: generateSessionId('score'),
        action: 'scoring',
      })

      for await (const event of events) {
        if (event.type === 'final' && event.result?.metadata) {
          const { score, scoreBreakdown, weaknesses, suggestedFixes } = event.result.metadata

          if (score && scoreBreakdown) {
            setScoreData({
              score,
              scoreBreakdown,
              weaknesses: weaknesses ?? [],
              suggestedFixes: suggestedFixes ?? [],
            })
            setImproveInstruction(formatSuggestionsAsText(suggestedFixes || []))
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

  /**
   * Submit improve request to AI
   */
  const handleSubmitImprove = async () => {
    if (!improveInstruction.trim()) return

    setIsImproving(true)
    setError(null)
    setProgress([])

    try {
      const events = await streamMultiPassGeneration({
        ...state,
        contentInstruction: improveInstruction,
        brand,
        sessionId: generateSessionId('improve'),
        action: 'improve',
      })

      await handleStreamEvents(events, {
        onTitleReady: (title) => setField('title', title),
        onHashtagsReady: (hashtags) => setField('hashtags', hashtags),
        onBodyToken: (_, accumulatedBody) => {
          setField('body', accumulatedBody)
          scrollBodyTextareaToBottom()
        },
        onProgress: (message) => setProgress((p) => [...p, message]),
        onFinal: () => {
          setImproveInstruction('')
        },
        onError: (message) => {
          setError(message)
          setProgress([])
        },
      })
    } catch (err) {
      console.error('Improve failed:', err)
      setError('Failed to improve content. Please try again.')
    } finally {
      setIsImproving(false)
    }
  }

  // Early returns for different states
  if (!hasContent) return null

  if (isScoring) {
    return <LoadingState message="Analyzing content quality..." />
  }

  if (error) {
    return <AlertBox message={error} variant="error" />
  }

  // Show initial score button
  if (!scoreData) {
    return (
      <SectionContainer variant="green">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              AI Quality Score
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analyze your content across 5 quality criteria
            </p>
          </div>
          <Button type="button" onClick={handleScoreContent} variant="default" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Score Content
          </Button>
        </div>
      </SectionContainer>
    )
  }

  // Main score display
  const scoreLabel = getScoreLabel(scoreData.score)
  const scoreBadgeClass = getScoreBadgeClass(scoreData.score)

  return (
    <SectionContainer variant="green">
      {/* Header with Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-lg">AI Quality Score: {scoreData.score}/100</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${scoreBadgeClass}`}>
            {scoreLabel}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={handleScoreContent} variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Re-score
          </Button>
        </div>
      </div>

      {/* Score Breakdown Grid */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {Object.entries(scoreData.scoreBreakdown).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{value}/20</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 capitalize mt-1">
              {getBreakdownLabel(key)}
            </div>
            <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getBreakdownBarClass(value)}`}
                style={{ width: `${(value / 20) * 100}%` }}
              />
            </div>
          </div>
        ))}
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

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Customize Improvement Instructions
          </h4>
        </div>

        <Textarea
          value={improveInstruction}
          onChange={(e) => setImproveInstruction(e.target.value)}
          placeholder="Edit or add improvement instructions..."
          className="min-h-[120px] text-sm"
          disabled={isImproving}
        />

        {/* Progress Indicator */}
        {progress.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            {progress.slice(-3).map((step, idx) => (
              <div key={idx} className="animate-in fade-in-50 duration-200">
                {step}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            AI will regenerate your content based on these instructions
          </p>
          <div className="flex gap-2">
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
                  {progress.length > 0 ? progress[progress.length - 1] : 'Improving...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improvements
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

export default memo(QualityScoreDisplaySection)
