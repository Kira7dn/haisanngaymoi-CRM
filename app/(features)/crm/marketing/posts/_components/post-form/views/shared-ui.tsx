/**
 * Shared UI Components
 * Reusable UI elements for AI generation and scoring features
 */

import { cn } from '@/lib/utils'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface AlertBoxProps {
  message: string
  variant?: 'warning' | 'error' | 'info'
  className?: string
}

export function AlertBox({ message, variant = 'warning', className }: AlertBoxProps) {
  const variantStyles = {
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  }

  return (
    <div className={cn(
      'flex items-start gap-2 p-3 border rounded-md',
      variantStyles[variant],
      className
    )}>
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="text-sm">{message}</div>
    </div>
  )
}

interface LoadingStateProps {
  message: string
  className?: string
}

export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <div className={cn(
      'border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10',
      'flex items-center justify-center gap-2',
      className
    )}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
    </div>
  )
}

interface ProgressIndicatorProps {
  steps: string[]
  className?: string
}

export function ProgressIndicator({ steps, className }: ProgressIndicatorProps) {
  if (steps.length === 0) return null

  return (
    <div className={cn('text-xs text-gray-500 dark:text-gray-400 space-y-1', className)}>
      {steps.map((step, idx) => (
        <div key={idx} className="animate-in fade-in-50 duration-200">
          {step}
        </div>
      ))}
    </div>
  )
}

interface SectionContainerProps {
  children: React.ReactNode
  variant?: 'default' | 'purple' | 'green'
  className?: string
}

export function SectionContainer({ children, variant = 'default', className }: SectionContainerProps) {
  const variantStyles = {
    default: 'from-gray-50 to-blue-50 dark:from-gray-900/10 dark:to-blue-900/10',
    purple: 'from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20',
    green: 'from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10',
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 bg-gradient-to-r',
      variantStyles[variant],
      className
    )}>
      {children}
    </div>
  )
}
