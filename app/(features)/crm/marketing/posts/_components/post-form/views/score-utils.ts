/**
 * Quality Score Utilities
 * Pure functions for score calculations and styling
 */

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  NEEDS_IMPROVEMENT: 0,
} as const

export const BREAKDOWN_THRESHOLDS = {
  EXCELLENT: 16,
  GOOD: 12,
  NEEDS_IMPROVEMENT: 0,
} as const

export const SCORE_LABELS = {
  clarity: 'Clarity',
  engagement: 'Engagement',
  brandVoice: 'Brand Voice',
  platformFit: 'Platform Fit',
  safety: 'Safety',
} as const

export type ScoreBreakdown = {
  clarity: number
  engagement: number
  brandVoice: number
  platformFit: number
  safety: number
}

export interface ScoreData {
  score: number
  scoreBreakdown: ScoreBreakdown
  weaknesses: string[]
  suggestedFixes: string[]
}

/**
 * Get human-readable label for overall score
 */
export function getScoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'Excellent'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'Good'
  return 'Needs Improvement'
}

/**
 * Get Tailwind classes for score badge background
 */
export function getScoreBadgeClass(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
  }
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
}

/**
 * Get color for breakdown score bar
 */
export function getBreakdownBarClass(value: number): string {
  if (value >= BREAKDOWN_THRESHOLDS.EXCELLENT) return 'bg-green-500'
  if (value >= BREAKDOWN_THRESHOLDS.GOOD) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Get display label for breakdown category
 */
export function getBreakdownLabel(key: string): string {
  if (key in SCORE_LABELS) {
    return SCORE_LABELS[key as keyof typeof SCORE_LABELS]
  }
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * Format suggestions as numbered list
 */
export function formatSuggestionsAsText(suggestions: string[]): string {
  return suggestions.map((fix, idx) => `${idx + 1}. ${fix}`).join('\n')
}
