"use client";

import { useRef } from "react";
import { useFileUpload } from "@/lib/hooks/use-file-upload";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import type { PostMedia } from "@/core/domain/marketing/post";

export interface MediaUploadProps {
  value?: PostMedia;
  onChange: (media: PostMedia | null) => void;
  folder?: string;
  maxSize?: number; // in MB (optional, uses type-based defaults)
  disabled?: boolean;
}

/**
 * MediaUpload - Smart media upload component with auto-detection
 *
 * Features:
 * - Accepts both images and videos
 * - Auto-detects file type from MIME
 * - Returns PostMedia object with type and URL
 * - Type-specific size limits (200MB video, 10MB image)
 * - Preview display (image or video player)
 *
 * Breaking Change from v1:
 * - value: string → PostMedia
 * - onChange: (url: string) → (media: PostMedia | null)
 * - Removed type prop (auto-detected)
 */
export function MediaUpload({
  value,
  onChange,
  folder = "media",
  maxSize,
  disabled = false,
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accept both images and videos
  const fileAccept = "image/*,video/*";

  // File type state (detected from uploaded file)
  const currentType = value?.type || null;

  const { isUploading, error, upload } = useFileUpload({
    fileType: currentType || "image", // Default for hook, but we override
    folder,
    onSuccess: () => { }, // We handle success manually in handleFileChange
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect media type from file MIME type
    const detectedType: 'image' | 'video' = file.type.startsWith('video/')
      ? 'video'
      : 'image';

    // Type-specific size limits
    const fileMaxSize = maxSize || (detectedType === 'video' ? 200 : 10);

    // Validate file size
    if (file.size > fileMaxSize * 1024 * 1024) {
      alert(`${detectedType === 'video' ? 'Video' : 'Image'} must be less than ${fileMaxSize}MB`);
      return;
    }

    try {
      // Upload to S3
      const result = await upload(file);

      if (result?.url) {
        // Return PostMedia object with detected type
        onChange({
          type: detectedType,
          url: result.url,
        });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      // Error is already handled by useFileUpload hook
    }
  };

  const handleRemove = () => {
    onChange(null); // Pass null instead of empty string
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value?.url ? (
        <div className="relative border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
          {value.type === "video" ? (
            <video src={value.url} controls className="w-full max-h-48" />
          ) : (
            <img
              src={value.url}
              alt="Preview"
              className="w-full max-h-48 object-contain"
              loading="lazy"
            />
          )}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleRemove}
            className="absolute top-2 right-2"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center ${!disabled && !isUploading
            ? "cursor-pointer hover:border-primary transition-colors"
            : "opacity-50 cursor-not-allowed"
            }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">
                Click to upload image or video
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 10MB for images, 200MB for videos
              </p>
            </>
          )}
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept={fileAccept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
