/**
 * Shared Stream Event Handler
 * Eliminates duplicate event processing logic between AIGenerationSection and QualityScoreDisplaySection
 */

import type { StreamEvent } from '../actions/stream-generate-action'

export interface StreamEventCallbacks {
  onTitleReady?: (title: string) => void
  onHashtagsReady?: (hashtags: string) => void
  onPassStart?: (pass: string) => void
  onPassSkip?: (pass: string) => void
  onBodyToken?: (content: string, accumulatedBody: string) => void
  onPassComplete?: (pass: string) => void
  onFinal?: (result?: any) => void
  onError?: (message: string) => void
  onProgress?: (message: string) => void
}

/**
 * Process stream events with callbacks
 * @returns accumulated body content
 */
export async function handleStreamEvents(
  events: AsyncIterable<StreamEvent>,
  callbacks: StreamEventCallbacks
): Promise<string> {
  let body = ''

  for await (const event of events) {
    switch (event.type) {
      case 'title:ready':
        callbacks.onTitleReady?.(event.title)
        callbacks.onProgress?.('📝 Title generated')
        break

      case 'hashtags:ready':
        callbacks.onHashtagsReady?.(event.hashtags)
        callbacks.onProgress?.('🏷️ Hashtags generated')
        break

      case 'pass:start':
        body = '' // Reset body for new pass
        callbacks.onPassStart?.(event.pass)
        callbacks.onProgress?.(`▶️ Starting ${event.pass}...`)
        break

      case 'pass:skip':
        callbacks.onPassSkip?.(event.pass)
        callbacks.onProgress?.(`⏭️ Skipping ${event.pass}`)
        break

      case 'body:token':
        body += event.content
        callbacks.onBodyToken?.(event.content, body)
        break

      case 'pass:complete':
        callbacks.onPassComplete?.(event.pass)
        callbacks.onProgress?.(`✅ ${event.pass} completed`)
        break

      case 'final':
        callbacks.onFinal?.(event.result)
        callbacks.onProgress?.('🎉 Generation completed!')
        break

      case 'error':
        callbacks.onError?.(event.message)
        return body
    }
  }

  return body
}

/**
 * Generate unique session ID
 */
export function generateSessionId(prefix: string = 'session'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
