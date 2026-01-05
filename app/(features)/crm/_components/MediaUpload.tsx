"use client";

import { useRef } from "react";
import { useFileUpload } from "@/lib/hooks/use-file-upload";
import { Image, Video, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import type { PostMedia } from "@/core/domain/marketing/post";

export interface MediaUploadProps {
  value?: PostMedia;
  onChange: (media: PostMedia | null) => void;
  folder?: string;
  maxSize?: number; // in MB (optional, uses type-based defaults)
  disabled?: boolean;
  allowedTypes?: ("image" | "video" | "document")[]; // Restrict which buttons to show
}

/**
 * MediaUpload - Compact button-based media upload component
 *
 * Features:
 * - Compact button interface for photo/video/document uploads
 * - Auto-detects file type from MIME and extension
 * - Returns PostMedia object with type and URL
 * - Type-specific size limits (200MB video, 10MB image, 20MB document)
 * - Preview display (image, video player, or document info)
 */
export function MediaUpload({
  value,
  onChange,
  folder = "media",
  maxSize,
  disabled = false,
  allowedTypes = ["image", "video", "document"], // Default to all types
}: MediaUploadProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Accept all file types
  const fileAccept =
    "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";

  // File type state (detected from uploaded file)
  const currentType = value?.type || null;

  const { isUploading, error, upload } = useFileUpload({
    fileType: undefined, // Enable auto-detection
    folder,
    onSuccess: () => {}, // We handle success manually in handleFileChange
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect media type from file MIME type
    let detectedType: "image" | "video" | "document";
    if (file.type.startsWith("video/")) {
      detectedType = "video";
    } else if (file.type.startsWith("image/")) {
      detectedType = "image";
    } else {
      detectedType = "document";
    }

    // Check if detected type is allowed
    if (!allowedTypes.includes(detectedType)) {
      const allowedNames = allowedTypes.join(", ");
      alert(`Only ${allowedNames} files are allowed`);
      return;
    }

    // Type-specific size limits
    const fileMaxSize =
      maxSize ||
      (detectedType === "video" ? 200 : detectedType === "image" ? 10 : 20); // documents

    // Validate file size
    if (file.size > fileMaxSize * 1024 * 1024) {
      const typeName =
        detectedType === "video"
          ? "Video"
          : detectedType === "image"
            ? "Image"
            : "Document";
      alert(`${typeName} must be less than ${fileMaxSize}MB`);
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
          fileName: file.name,
          fileSize: file.size,
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      // Error is already handled by useFileUpload hook
    }
  };

  const handleRemove = () => {
    onChange(null); // Pass null instead of empty string
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {value?.url ? (
        <div className="relative border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
          {value.type === "video" ? (
            <video src={value.url} controls className="w-full max-h-48" />
          ) : value.type === "document" ? (
            <div className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium truncate">
                  {value.fileName || "Document"}
                </p>
                <p className="text-xs text-gray-500">
                  {value.fileSize
                    ? `${(value.fileSize / 1024 / 1024).toFixed(2)} MB`
                    : "Unknown size"}
                </p>
              </div>
              <a
                href={value.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Open
              </a>
            </div>
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
        <div className="flex gap-3 flex-wrap">
          {/* Photo button */}
          {allowedTypes.includes("image") && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                !disabled && !isUploading && photoInputRef.current?.click()
              }
              disabled={disabled || isUploading}
              className="cursor-pointer flex items-center gap-2 rounded-full px-4 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">Photo</span>
            </Button>
          )}

          {/* Video button */}
          {allowedTypes.includes("video") && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                !disabled && !isUploading && videoInputRef.current?.click()
              }
              disabled={disabled || isUploading}
              className="cursor-pointer flex items-center gap-2 rounded-full px-4 py-2 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950 dark:hover:bg-pink-900 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300"
            >
              <Video className="h-4 w-4" />
              <span className="text-sm font-medium">Video</span>
            </Button>
          )}

          {/* Document button */}
          {allowedTypes.includes("document") && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                !disabled && !isUploading && documentInputRef.current?.click()
              }
              disabled={disabled || isUploading}
              className="cursor-pointer flex items-center gap-2 rounded-full px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Document</span>
            </Button>
          )}
        </div>
      )}

      {/* Hidden file inputs */}
      <Input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
      <Input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
