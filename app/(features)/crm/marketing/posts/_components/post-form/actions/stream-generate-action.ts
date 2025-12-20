import { GenerationEvent, PostGenRequest } from "@/core/application/usecases/marketing/post/generate-post/stream-post-generationn"

/**
 * Re-export types for use in components
 */
export type StreamEvent = GenerationEvent

/**
 * Client-side helper to consume streaming generation events
 * Uses fetch with SSE (Server-Sent Events) format
 */
export async function* streamMultiPassGeneration(
  params: PostGenRequest
): AsyncGenerator<GenerationEvent> {
  const response = await fetch('/api/posts/gen-content/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('No response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE messages (format: "data: {...}\n\n")
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || '' // Keep incomplete message in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6) // Remove "data: " prefix
          try {
            const event: GenerationEvent = JSON.parse(jsonStr)
            yield event
          } catch (error) {
            console.error('Failed to parse SSE event:', jsonStr, error)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

