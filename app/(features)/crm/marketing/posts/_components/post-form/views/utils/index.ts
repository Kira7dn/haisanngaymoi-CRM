// Helper function to auto-scroll body textarea to bottom
export const scrollBodyTextareaToBottom = () => {
  // Use requestAnimationFrame for smooth scrolling after DOM update
  requestAnimationFrame(() => {
    const bodyTextarea = document.getElementById('body') as HTMLTextAreaElement
    if (bodyTextarea) {
      bodyTextarea.scrollTop = bodyTextarea.scrollHeight
    }
  })
}
// Helper function to parse hashtags from various formats
export const parseHashtags = (
  input?: string | string[],
  options?: {
    withHash?: boolean
    lowercase?: boolean
  }
): string[] => {
  if (!input) return []

  const { withHash = false, lowercase = true } = options || {}

  const raw =
    typeof input === 'string'
      ? input.split(/[,\s]+/)
      : input

  return Array.from(
    new Set(
      raw
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.startsWith('#') ? tag.slice(1) : tag)
        .map((tag) => (lowercase ? tag.toLowerCase() : tag))
    )
  ).map((tag) => (withHash ? `#${tag}` : tag))
}
