"use client"

import { useState, useEffect } from "react"
import { Button } from "@shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card"
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface TikTokConnectionProps {
  isConnected: boolean
  authData: {
    id: string
    openId: string
    platform: string
    expiresAt: string
    createdAt: string
    scope?: string
  } | null
}

export default function TikTokConnection({
  isConnected: initialConnected,
  authData: initialAuthData,
}: TikTokConnectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(initialConnected)
  const [authData, setAuthData] = useState(initialAuthData)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  // Handle OAuth callback status
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "true") {
      setMessage({
        type: "success",
        text: "TikTok account connected successfully!",
      })
      setIsConnected(true)
      // Clear URL params
      router.replace("/crm/social/tiktok")
    } else if (error) {
      setMessage({
        type: "error",
        text: `Failed to connect: ${decodeURIComponent(error)}`,
      })
    }
  }, [searchParams, router])

  const handleConnect = () => {
    setIsLoading(true)
    // Redirect to OAuth start endpoint
    window.location.href = "/api/auth/tiktok/start"
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your TikTok account?")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/tiktok/disconnect", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect")
      }

      setMessage({
        type: "success",
        text: data.message || "TikTok account disconnected successfully",
      })
      setIsConnected(false)
      setAuthData(null)
      router.refresh()
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to disconnect",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      {/* Connection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <svg className="h-8 w-8 fill-white dark:fill-black" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <div>
                <CardTitle>TikTok Account</CardTitle>
                <CardDescription>
                  {isConnected
                    ? "Your TikTok account is connected"
                    : "Connect your TikTok account to publish content"}
                </CardDescription>
              </div>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isConnected
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Not Connected
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isConnected && authData ? (
            <div className="space-y-3">
              {/* Connection Details */}
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Open ID:</span>
                  <span className="font-mono">{authData.openId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Connected:</span>
                  <span>{new Date(authData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                  <span>{new Date(authData.expiresAt).toLocaleDateString()}</span>
                </div>
                {authData.scope && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Scopes:</span>
                    <span className="text-right text-xs">{authData.scope}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    "Disconnect"
                  )}
                </Button>
                <Button
                  variant="default"
                  onClick={() => router.push("/crm/campaigns/posts")}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Posts
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect your TikTok account to:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>Publish videos directly from the CRM</li>
                <li>Track video performance and analytics</li>
                <li>Manage your TikTok content calendar</li>
                <li>Auto-publish scheduled content</li>
              </ul>
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect TikTok Account
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
