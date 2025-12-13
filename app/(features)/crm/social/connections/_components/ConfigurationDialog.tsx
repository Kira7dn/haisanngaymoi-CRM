"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@shared/ui/dialog"
import { Button } from "@shared/ui/button"
import WebhookGuidePanel from "./WebhookGuidePanel"
import { Platform } from "@/core/domain/marketing/post"

interface ConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: Platform
}

export default function ConfigurationDialog({
  open,
  onOpenChange,
  platform,
}: ConfigurationDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Configure {platform.charAt(0).toUpperCase() + platform.slice(1)} Webhook
          </DialogTitle>
          <DialogDescription>
            Set up webhook for recieve and process messages real-time.
          </DialogDescription>
        </DialogHeader>
        <WebhookGuidePanel platform={platform} />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
