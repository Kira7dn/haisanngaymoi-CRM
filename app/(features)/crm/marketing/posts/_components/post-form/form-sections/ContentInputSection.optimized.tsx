'use client'

import { memo, useCallback, ChangeEvent } from 'react'
import { Label } from '@shared/ui/label'
import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'
import { Sparkles } from 'lucide-react'
import {
  usePostFormState,
  usePostFormEvents
} from '../PostFormContext'

/**
 * ContentInputSection - OPTIMIZED with React.memo & useCallback
 *
 * ✅ OPTIMIZATIONS:
 * 1. Wrapped with React.memo
 * 2. useCallback for inline event handlers
 * 3. Stable event references
 */
function ContentInputSection() {
  const state = usePostFormState()
  const events = usePostFormEvents()

  // ✅ OPTIMIZATION: Memoize event handlers
  const handleIdeaChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    events.setField('idea', e.target.value)
  }, [events])

  const handleProductChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const productId = parseInt(e.target.value)
    const product = state.products.find(p => p.id === productId)
    events.setField('product', product || null)
  }, [state.products, events])

  const handleContentInstructionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    events.setField('contentInstruction', e.target.value)
  }, [events])

  const handleTitleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    events.setField('title', e.target.value)
  }, [events])

  const handleBodyChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    events.setField('body', e.target.value)
  }, [events])

  const handleVariationSelect = useCallback((title: string, content: string) => {
    events.setField('title', title)
    events.setField('body', content)
  }, [events])

  const handleHideVariations = useCallback(() => {
    events.setField('variations', [])
  }, [events])

  return (
    <>
      {/* Post Idea */}
      <div>
        <Label htmlFor="idea">Post Idea (from schedule or custom)</Label>
        <textarea
          id="idea"
          value={state.idea || ''}
          onChange={handleIdeaChange}
          rows={2}
          placeholder="e.g., Highlight sustainable fishing practices..."
          className="w-full border rounded-md p-3"
        />
      </div>

      {/* Product Selection */}
      {state.products.length > 0 && (
        <div>
          <Label htmlFor="product">Product (optional)</Label>
          <select
            id="product"
            value={state.product?.id || ''}
            onChange={handleProductChange}
            className="w-full border rounded-md p-2"
          >
            <option value="">None (no specific product)</option>
            {state.products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          {state.product?.url && (
            <p className="text-xs text-gray-500 mt-1">
              Product URL: <a href={state.product.url} target="_blank" rel="noopener noreferrer" className="underline">{state.product.url}</a>
            </p>
          )}
        </div>
      )}

      {/* Detail Content Instruction */}
      <div>
        <Label htmlFor="contentInstruction">Specific Instructions for this Post</Label>
        <textarea
          id="contentInstruction"
          value={state.contentInstruction || ''}
          onChange={handleContentInstructionChange}
          rows={3}
          placeholder="e.g., Emphasize premium quality, include customer testimonial, add urgency..."
          className="w-full border rounded-md p-3"
        />
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          required
          value={state.title}
          onChange={handleTitleChange}
        />
      </div>

      {/* Content Body */}
      <div>
        <Label htmlFor="body">Content</Label>
        <textarea
          id="body"
          name="body"
          rows={6}
          value={state.body}
          onChange={handleBodyChange}
          className="w-full border rounded-md p-3"
        />
      </div>

      {/* Variations Selector */}
      {state.variations.length > 0 && (
        <div className="border rounded-lg p-4 space-y-3 bg-blue-50 dark:bg-blue-900/10">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generated Variations
          </h3>
          <div className="space-y-2">
            {state.variations.map((variation, index) => (
              <VariationButton
                key={index}
                variation={variation}
                onSelect={handleVariationSelect}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleHideVariations}
          >
            Hide Variations
          </Button>
        </div>
      )}
    </>
  )
}

/**
 * ✅ OPTIMIZATION: Extract VariationButton as separate memoized component
 * Prevents re-rendering all variations when one is clicked
 */
const VariationButton = memo(function VariationButton({
  variation,
  onSelect
}: {
  variation: { title: string; content: string; style: string }
  onSelect: (title: string, content: string) => void
}) {
  const handleClick = useCallback(() => {
    onSelect(variation.title, variation.content)
  }, [variation.title, variation.content, onSelect])

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left p-3 border rounded-md hover:bg-white dark:hover:bg-gray-800 bg-white dark:bg-gray-900 transition-colors"
    >
      <div className="font-medium text-xs text-gray-500 uppercase mb-1">
        {variation.style}
      </div>
      <div className="font-semibold text-sm mb-1">{variation.title}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {variation.content}
      </div>
    </button>
  )
})

/**
 * ✅ OPTIMIZATION: Export memoized component
 */
export default memo(ContentInputSection)
