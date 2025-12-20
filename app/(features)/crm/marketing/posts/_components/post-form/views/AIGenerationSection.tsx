'use client'

import { useState, useMemo } from 'react'
import { Sparkles, Zap, Loader2 } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/@shared/ui/tabs'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/@shared/ui/card'
import { usePostFormContext } from '../PostFormContext'
import { usePostSettingStore } from '../../../_store/usePostSettingStore'
import { streamMultiPassGeneration } from '../actions/stream-generate-action'
import { handleStreamEvents, generateSessionId } from './stream-event-handler'
import { scrollBodyTextareaToBottom } from './utils'
import { AlertBox, SectionContainer } from './shared-ui'

export default function AIGenerationSection() {
  const { state, setField } = usePostFormContext()
  const { brand } = usePostSettingStore()

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  // Generate session ID once
  const sessionId = useMemo(() => generateSessionId(), [])

  // Check if form has minimum required input
  const isDisabled = !state.idea && !state.product && !state.contentInstruction && !state.title

  /**
   * Generic generation handler - eliminates duplication
   */
  const handleGeneration = async (action: 'singlepass' | 'multipass') => {
    setIsGenerating(true)
    setProgress([])
    setErrorMessage(undefined)

    try {
      const events = streamMultiPassGeneration({
        ...state,
        brand,
        sessionId,
        action,
      })

      await handleStreamEvents(events, {
        onTitleReady: (title) => setField('title', title),
        onHashtagsReady: (hashtags) => setField('hashtags', hashtags),
        onBodyToken: (_, accumulatedBody) => {
          setField('body', accumulatedBody)
          scrollBodyTextareaToBottom()
        },
        onProgress: (message) => setProgress((p) => [...p, message]),
        onError: (message) => {
          setErrorMessage(message)
          setProgress([])
        },
      })
    } catch (err) {
      console.error('Generation failed:', err)
      setErrorMessage('Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
      // Clear progress after completion
      if (!errorMessage) {
        setTimeout(() => setProgress([]), 2000)
      }
    }
  }

  return (
    <SectionContainer variant="purple">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">AI Content Generation</h3>
        </div>
      </div>

      {/* Generation Mode Tabs */}
      <Tabs defaultValue="simple" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simple" className="gap-2">
            <Zap className="h-4 w-4" />
            Simple (3-5s)
          </TabsTrigger>
          <TabsTrigger value="multipass" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Multi-pass (15-25s)
          </TabsTrigger>
        </TabsList>

        {/* Simple Mode */}
        <TabsContent value="simple" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-purple-600" />
                Single-pass Generation
              </CardTitle>
              <CardDescription>
                Fast content generation in one pass. Best for quick drafts.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                type="button"
                variant="default"
                onClick={() => handleGeneration('singlepass')}
                disabled={isGenerating || isDisabled}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Multi-pass Mode */}
        <TabsContent value="multipass" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Multi-pass Generation
              </CardTitle>
              <CardDescription>
                5-stage process (Idea → Angle → Outline → Draft → Enhance) for premium quality content.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col gap-3">
              <Button
                type="button"
                variant="default"
                onClick={() => handleGeneration('multipass')}
                disabled={isGenerating || isDisabled}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress.length > 0 ? progress[progress.length - 1] : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>

              {/* Progress indicator */}
              {progress.length > 0 && (
                <div className="w-full text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  {progress.slice(-3).map((step, idx) => (
                    <div key={idx} className="animate-in fade-in-50 duration-200">
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Message */}
      {errorMessage && <AlertBox message={errorMessage} variant="warning" className="mt-3" />}
    </SectionContainer>
  )
}
