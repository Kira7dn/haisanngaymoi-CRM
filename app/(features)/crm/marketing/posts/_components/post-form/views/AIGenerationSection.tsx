'use client'

import { Button } from '@shared/ui/button'
import { Sparkles, Zap, Settings, Info, Loader2, AlertTriangle } from 'lucide-react'
import { usePostFormContext } from '../PostFormContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/@shared/ui/tabs'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/@shared/ui/card'

export default function AIGenerationSection() {
  const { state, setField, products } = usePostFormContext()
  const isGenerating = false
  const isDisabled = false
  return (
    <div className="border rounded-lg p-4 bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">AI Content Generation</h3>
        </div>
      </div>
      <div className="flex w-full flex-col gap-6">
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
                  // onClick={onGenerate}
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
                  // onClick={onGenerate}
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
        </Tabs>
      </div>

      {/* Generation Progress */}
      {/* {progress.length > 0 && (
        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
          {progress.map((progressItem, idx) => (
            <div key={idx}>{progressItem}</div>
          ))}
        </div>
      )} */}

      {/* Similarity Warning */}
      {/* {similarityWarning && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            {similarityWarning}
          </div>
        </div>
      )} */}
    </div>
  )
}
