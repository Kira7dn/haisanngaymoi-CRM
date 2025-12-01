"use client"

import { Input } from "@shared/ui/input"
import { Label } from "@shared/ui/label"
import { Alert, AlertDescription } from "@shared/ui/alert"
import { InfoIcon } from "lucide-react"
import type { SocialPlatform } from "@/core/domain/social/social-auth"

interface PlatformSettingsFormProps {
  platform: SocialPlatform
  config: any
  onChange: (config: any) => void
}

export default function PlatformSettingsForm({
  platform,
  config,
  onChange,
}: PlatformSettingsFormProps) {
  const updateField = (platform: string, field: string, value: string) => {
    onChange({
      ...config,
      [platform]: {
        ...(config[platform] || {}),
        [field]: value,
      },
    })
  }

  const renderZaloFields = () => (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Get these credentials from{" "}
          <a
            href="https://developers.zalo.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Zalo Developer Portal
          </a>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="zalo-app-id">App ID *</Label>
        <Input
          id="zalo-app-id"
          placeholder="Enter your Zalo App ID"
          value={config.zalo?.appId || ""}
          onChange={(e) => updateField("zalo", "appId", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="zalo-app-secret">App Secret *</Label>
        <Input
          id="zalo-app-secret"
          type="password"
          placeholder="Enter your Zalo App Secret"
          value={config.zalo?.appSecret || ""}
          onChange={(e) => updateField("zalo", "appSecret", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="zalo-oa-id">Official Account ID (OA ID) *</Label>
        <Input
          id="zalo-oa-id"
          placeholder="Enter your Zalo OA ID"
          value={config.zalo?.oaId || ""}
          onChange={(e) => updateField("zalo", "oaId", e.target.value)}
          required
        />
      </div>
    </div>
  )

  const renderTikTokFields = () => (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Get these credentials from{" "}
          <a
            href="https://developers.tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            TikTok Developer Portal
          </a>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="tiktok-client-key">Client Key *</Label>
        <Input
          id="tiktok-client-key"
          placeholder="Enter your TikTok Client Key"
          value={config.tiktok?.clientKey || ""}
          onChange={(e) => updateField("tiktok", "clientKey", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tiktok-client-secret">Client Secret *</Label>
        <Input
          id="tiktok-client-secret"
          type="password"
          placeholder="Enter your TikTok Client Secret"
          value={config.tiktok?.clientSecret || ""}
          onChange={(e) => updateField("tiktok", "clientSecret", e.target.value)}
          required
        />
      </div>
    </div>
  )

  const renderFacebookFields = () => (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Get these credentials from{" "}
          <a
            href="https://developers.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Facebook Developer Portal
          </a>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="fb-app-id">App ID *</Label>
        <Input
          id="fb-app-id"
          placeholder="Enter your Facebook App ID"
          value={config.facebook?.appId || ""}
          onChange={(e) => updateField("facebook", "appId", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fb-app-secret">App Secret *</Label>
        <Input
          id="fb-app-secret"
          type="password"
          placeholder="Enter your Facebook App Secret"
          value={config.facebook?.appSecret || ""}
          onChange={(e) => updateField("facebook", "appSecret", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fb-page-id">Page ID</Label>
        <Input
          id="fb-page-id"
          placeholder="Your Facebook Page ID (auto-filled from OAuth)"
          value={config.facebook?.pageId || ""}
          onChange={(e) => updateField("facebook", "pageId", e.target.value)}
          disabled
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fb-verify-token">Webhook Verify Token (Optional)</Label>
        <Input
          id="fb-verify-token"
          placeholder="Custom verify token for webhook verification"
          value={config.facebook?.verifyToken || ""}
          onChange={(e) => updateField("facebook", "verifyToken", e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Leave empty to use default. Used during webhook setup.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {platform === "zalo" && renderZaloFields()}
      {platform === "tiktok" && renderTikTokFields()}
      {platform === "facebook" && renderFacebookFields()}
      {platform === "youtube" && (
        <Alert>
          <AlertDescription>
            YouTube configuration coming soon...
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
