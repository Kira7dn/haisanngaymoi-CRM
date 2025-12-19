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