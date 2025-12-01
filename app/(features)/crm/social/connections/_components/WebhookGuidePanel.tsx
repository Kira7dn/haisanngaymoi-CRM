"use client"

import { useState } from "react"
import { Button } from "@shared/ui/button"
import { Alert, AlertDescription } from "@shared/ui/alert"
import { CheckCircle2, Copy, ExternalLink } from "lucide-react"
import type { SocialPlatform } from "@/core/domain/social/social-auth"

interface WebhookGuidePanelProps {
  platform: SocialPlatform
}

export default function WebhookGuidePanel({ platform }: WebhookGuidePanelProps) {
  const [copied, setCopied] = useState(false)

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/${platform}`
    : `/api/webhooks/${platform}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderZaloGuide = () => (
    <div className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <AlertDescription>
          <strong>Note:</strong> Zalo webhook is configured through the Zalo Developer Portal,
          not programmatically.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <h3 className="font-semibold">Step-by-Step Guide:</h3>

        <ol className="space-y-3 list-decimal list-inside">
          <li>
            Go to{" "}
            <a
              href="https://developers.zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Zalo Developer Portal
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>

          <li>Select your Official Account (OA) application</li>

          <li>Navigate to <strong>Webhook Settings</strong> or <strong>Cài đặt Webhook</strong></li>

          <li>
            Enter your webhook URL:
            <div className="flex items-center gap-2 mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md font-mono text-sm">
              <code className="flex-1 break-all">{webhookUrl}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </li>

          <li>Zalo will send a verification request to your webhook URL</li>

          <li>
            After successful verification, enable these event subscriptions:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
              <li><code>user_send_text</code> - Text messages</li>
              <li><code>user_send_image</code> - Image messages</li>
              <li><code>user_send_file</code> - File attachments</li>
              <li><code>user_send_audio</code> - Audio messages</li>
              <li><code>user_send_video</code> - Video messages</li>
            </ul>
          </li>

          <li>Save your webhook configuration</li>
        </ol>
      </div>

      <Alert>
        <AlertDescription>
          💡 <strong>Tip:</strong> Make sure your webhook URL is publicly accessible.
          Use ngrok for local development.
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderTikTokGuide = () => (
    <div className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <AlertDescription>
          <strong>Note:</strong> TikTok webhook is configured through the Developer Portal.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <h3 className="font-semibold">Step-by-Step Guide:</h3>

        <ol className="space-y-3 list-decimal list-inside">
          <li>
            Go to{" "}
            <a
              href="https://developers.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              TikTok Developer Portal
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>

          <li>Select your application</li>

          <li>Go to <strong>Webhook Settings</strong></li>

          <li>
            Register your callback URL:
            <div className="flex items-center gap-2 mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md font-mono text-sm">
              <code className="flex-1 break-all">{webhookUrl}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </li>

          <li>
            Your endpoint must:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
              <li>Use HTTPS (not HTTP)</li>
              <li>Respond with 200 status code immediately</li>
              <li>Handle GET request with <code>challenge</code> parameter for verification</li>
            </ul>
          </li>

          <li>TikTok will verify your webhook by sending a GET request</li>

          <li>After verification, you'll start receiving POST requests for events</li>
        </ol>
      </div>

      <Alert>
        <AlertDescription>
          💡 <strong>Tip:</strong> TikTok retries failed deliveries for up to 72 hours using exponential backoff.
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderFacebookGuide = () => (
    <div className="space-y-4">
      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
        <AlertDescription>
          <strong>Good news!</strong> Facebook webhook subscription is handled automatically
          when you select a page.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <h3 className="font-semibold">What happens automatically:</h3>

        <ul className="space-y-2 list-disc list-inside">
          <li>
            When you select a Facebook Page during OAuth, the system automatically subscribes
            to webhook events:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
              <li><code>messages</code> - Incoming messages</li>
              <li><code>messaging_postbacks</code> - Button clicks and interactions</li>
            </ul>
          </li>
        </ul>

        <h3 className="font-semibold mt-6">Manual verification (if needed):</h3>

        <ol className="space-y-3 list-decimal list-inside">
          <li>
            Go to{" "}
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Facebook Developer Portal
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>

          <li>Select your app → Webhooks</li>

          <li>
            Verify webhook URL is set to:
            <div className="flex items-center gap-2 mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md font-mono text-sm">
              <code className="flex-1 break-all">{webhookUrl}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </li>

          <li>Check that your Page is subscribed to webhook events</li>
        </ol>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {platform === "zalo" && renderZaloGuide()}
      {platform === "tiktok" && renderTikTokGuide()}
      {platform === "facebook" && renderFacebookGuide()}
      {platform === "youtube" && (
        <Alert>
          <AlertDescription>
            YouTube webhook guide coming soon...
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
