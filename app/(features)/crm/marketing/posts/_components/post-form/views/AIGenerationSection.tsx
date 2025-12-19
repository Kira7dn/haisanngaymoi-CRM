'use client'

import { Button } from '@shared/ui/button'
import { Sparkles, Zap, Loader2, AlertTriangle } from 'lucide-react'
import { usePostFormContext } from '../PostFormContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/@shared/ui/tabs'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/@shared/ui/card'
import { useMemo, useState } from 'react'
import { singlePassGenAction } from '../../../_actions/generate-content-action'
import { streamMultiPassGeneration } from '../actions/stream-generate-action'
import { usePostSettingStore } from '../../../_store/usePostSettingStore'

export default function AIGenerationSection() {
  const { state, setField } = usePostFormContext()
  const {
    title,
    body,
    hashtags,
    contentType,
    idea,
    product,
    contentInstruction,
  } = state
  const [progress, setProgress] = useState<string[]>([])
  const [similarityWarning, setSimilarityWarning] = useState<string | undefined>(undefined)
  const [isGenerating, setIsGenerating] = useState(false)
  const { brand } = usePostSettingStore()

  // Generate session ID for this generation session
  const sessionId = useMemo(() => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Check if form is ready for generation
  const isDisabled = !idea && !product && !contentInstruction && !title

  // Helper function to auto-scroll body textarea to bottom
  const scrollBodyTextareaToBottom = () => {
    // Use requestAnimationFrame for smooth scrolling after DOM update
    requestAnimationFrame(() => {
      const bodyTextarea = document.getElementById('body') as HTMLTextAreaElement
      if (bodyTextarea) {
        bodyTextarea.scrollTop = bodyTextarea.scrollHeight
      }
    })
  }

  // ========== AI Generation Actions ==========
  const genParam = {
    ...state,
    brand,
    sessionId,
  }
  const handleSinglePassGen = async () => {
    try {
      setIsGenerating(true)
      setProgress(['Starting single-pass generation...'])
      const result = await singlePassGenAction(genParam)
      if (!result.success && result.error) {
        setSimilarityWarning(result.error)
        return
      }
      // Update form with generated content
      if (result.success && result.content) {
        if (result.content.title) {
          setField('title', result.content.title)
        }
        if (result.content.body) {
          setField('body', result.content.body)
        }
        if (result.content.variations) {
          setField('variations', result.content.variations)
        }
      }

      setProgress(['Generation completed!'])
      setTimeout(() => setProgress([]), 2000)
    } catch (error) {
      console.error('Single-pass generation failed:', error)
      setProgress([])
      setSimilarityWarning('Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMultiPassGen = async () => {
    try {
      setIsGenerating(true)

      // Reset UI
      setProgress([])
      setSimilarityWarning(undefined)

      let draftBuffer = ''
      let enhanceBuffer = ''

      const stream = streamMultiPassGeneration(genParam)

      for await (const event of stream) {
        switch (event.type) {

          // ✅ TITLE COMES EARLY
          case 'title:ready':
            setField('title', event.title)
            setProgress(prev => [...prev, '📝 Title generated'])
            break

          // ✅ HASHTAGS COMES EARLY  
          case 'hashtags:ready':
            setField('hashtags', event.hashtags)
            setProgress(prev => [...prev, '🏷️ Hashtags generated'])
            break

          case 'pass:start':
            if (event.pass === 'draft') draftBuffer = ''
            if (event.pass === 'enhance') enhanceBuffer = ''
            setProgress(prev => [...prev, `▶️ Starting ${event.pass}...`])
            break

          case 'pass:skip':
            setProgress(prev => [...prev, `▶️ Skipping ${event.pass}...`])
            break

          case 'body:token':
            if (event.pass === 'draft') {
              draftBuffer += event.content
              setField('body', draftBuffer)
              // Auto-scroll body textarea to bottom
              scrollBodyTextareaToBottom()
            }
            if (event.pass === 'enhance') {
              enhanceBuffer += event.content
              setField('body', enhanceBuffer)
              // Auto-scroll body textarea to bottom
              scrollBodyTextareaToBottom()
            }
            break

          case 'pass:complete':
            setProgress(prev => [...prev, `✅ ${event.pass} completed`])
            break

          case 'final':
            setProgress(prev => [...prev, '🎉 Generation completed!'])
            break

          case 'error':
            setSimilarityWarning(event.message)
            setProgress([])
            break
        }
      }
    } catch (error) {
      console.error('Multi-pass generation failed:', error)
      setSimilarityWarning('Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">AI Content Generation</h3>
        </div>
      </div>
      <div className="flex w-full flex-col gap-6" suppressHydrationWarning>
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">
              <Zap className="h-4 w-4" />
              Simple (3-5s)
            </TabsTrigger>
            <TabsTrigger value="password">
              <Sparkles className="h-4 w-4" />
              Multi-pass (15-25s)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Single-pass</span>
                </CardTitle>
                <CardDescription>
                  Simple mode generates content quickly in one pass.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleSinglePassGen}
                  disabled={isGenerating || isDisabled}
                  className="w-full gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Single-pass...
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
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Multi-pass</span>
                </CardTitle>
                <CardDescription>
                  Multi-pass uses 5 stages (Idea → Angle → Outline → Draft → Enhance) for higher quality.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleMultiPassGen}
                  disabled={isGenerating || isDisabled}
                  className="w-full gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {progress.length > 0 ? progress[progress.length - 1] : 'Multi-pass...'}
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
        </Tabs>
      </div>

      {/* Similarity Warning */}
      {similarityWarning && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            {similarityWarning}
          </div>
        </div>
      )}
    </div>
  )
}
