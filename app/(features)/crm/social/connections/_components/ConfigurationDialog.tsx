"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs"
import { Button } from "@shared/ui/button"
import { Loader2 } from "lucide-react"
import type { SocialPlatform } from "@/core/domain/social/social-auth"
import PlatformSettingsForm from "./PlatformSettingsForm"
import WebhookGuidePanel from "./WebhookGuidePanel"

interface ConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: SocialPlatform
  connectionId: string
  existingConfig?: any
}

export default function ConfigurationDialog({
  open,
  onOpenChange,
  platform,
  connectionId,
  existingConfig,
}: ConfigurationDialogProps) {
  const [activeTab, setActiveTab] = useState("settings")
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState(existingConfig || {})

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/social-auth/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          platform,
          platformConfig: config,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save configuration")
      }

      // Success
      onOpenChange(false)
      window.location.reload() // Refresh to show updated config
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Configure {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Platform Settings</TabsTrigger>
            <TabsTrigger value="webhook">Webhook Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <PlatformSettingsForm
              platform={platform}
              config={config}
              onChange={setConfig}
            />
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4 mt-4">
            <WebhookGuidePanel platform={platform} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
