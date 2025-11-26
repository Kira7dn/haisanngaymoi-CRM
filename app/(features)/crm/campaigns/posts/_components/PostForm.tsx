'use client'

import { useState, useTransition, useCallback } from 'react'
import { createPostAction, updatePostAction } from '../actions'
import type { Post, Platform, ContentType, PostMedia } from '@/core/domain/campaigns/post'
import { MediaUpload } from '@/app/(features)/crm/_components/MediaUpload'
import { Button } from '@shared/ui/button'
import { Label } from '@shared/ui/label'
import { Input } from '@shared/ui/input'
import { X, Video, Loader2, AlertTriangle } from 'lucide-react'

// Platform options
const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-600' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-black' },
  { value: 'zalo', label: 'Zalo', color: 'bg-blue-400' },
]

// Content types
const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'reel', label: 'Reel / Shorts' },
  { value: 'post', label: 'Photo Post' },
  { value: 'video', label: 'Video dài (>60s)' },
  { value: 'article', label: 'Article / Bài viết dài' },
  { value: 'story', label: 'Story' }, // Thêm dòng này
]

// Compatibility mapping
const CONTENT_PLATFORM_MAP: Record<ContentType, Record<Platform, "supported" | "warning" | "unsupported">> = {
  reel: { facebook: "supported", youtube: "supported", tiktok: "supported", zalo: "unsupported" },
  short: { facebook: "supported", youtube: "supported", tiktok: "supported", zalo: "unsupported" }, // Thêm dòng này
  post: { facebook: "supported", youtube: "unsupported", tiktok: "warning", zalo: "supported" },
  video: { facebook: "supported", youtube: "supported", tiktok: "unsupported", zalo: "unsupported" },
  article: { facebook: "warning", youtube: "supported", tiktok: "unsupported", zalo: "supported" },
  story: { facebook: "supported", youtube: "unsupported", tiktok: "supported", zalo: "unsupported" }, // Thêm dòng này
}

export default function PostForm({ post, onClose }: { post?: Post; onClose?: () => void }) {
  const [isSubmitting, startTransition] = useTransition()
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(post?.platforms.map(p => p.platform) || [])
  const [contentType, setContentType] = useState<ContentType>(post?.contentType || 'post')
  const [media, setMedia] = useState<PostMedia[]>(post?.media || [])
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(' ') || '')
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check support status
  const getPlatformSupport = useCallback(
    (platform: Platform) => CONTENT_PLATFORM_MAP[contentType]?.[platform] || 'unsupported',
    [contentType]
  )

  const togglePlatform = (platform: Platform) => {
    if (getPlatformSupport(platform) !== "supported") return

    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  // Media type detection
  const getMediaType = useCallback((ct: ContentType): 'image' | 'video' => {
    return ['video', 'reel', 'live'].includes(ct) ? 'video' : 'image'
  }, [])

  const addMedia = (url: string) => {
    const newMedia: PostMedia = { type: getMediaType(contentType), url, order: media.length }
    setMedia(prev => [...prev, newMedia])
  }

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (selectedPlatforms.length === 0) {
      newErrors.platforms = 'Please select at least one supported platform'
    }

    selectedPlatforms.forEach((p) => {
      if (getPlatformSupport(p) !== "supported") {
        newErrors.platforms = 'One or more selected platforms do not support this content type'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (formData: FormData) => {
    if (!validateForm()) return

    try {
      formData.append('contentType', contentType)
      formData.append('platforms', JSON.stringify(selectedPlatforms))
      formData.append('media', JSON.stringify(media))
      formData.append('hashtags', hashtags)
      if (scheduledAt) formData.append('scheduledAt', scheduledAt)

      await new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            if (post?.id) {
              await updatePostAction(post.id, formData)
              alert('Post updated successfully')
            } else {
              await createPostAction(formData)
              alert('Post created successfully')
            }
            onClose?.()
            resolve()
          } catch (error) {
            console.error('Error saving post:', error)
            alert(error instanceof Error ? error.message : 'Failed to save post')
            reject(error)
          }
        })
      })
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{post ? 'Edit Post' : 'Create New Post'}</h2>
        {onClose && <Button type="button" variant="ghost" size="sm" onClick={onClose}><X /></Button>}
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required defaultValue={post?.title} />
      </div>

      {/* Content Body */}
      <div>
        <Label htmlFor="body">Content</Label>
        <textarea id="body" name="body" rows={6} defaultValue={post?.body}
          className="w-full border rounded-md p-3" />
      </div>

      {/* Content Type */}
      <div>
        <Label>Content Type *</Label>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map(ct => (
            <button key={ct.value} type="button" onClick={() => setContentType(ct.value)}
              className={`px-4 py-2 rounded-md border 
                ${contentType === ct.value ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <Label>Supported Platforms *</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => {
            const support = getPlatformSupport(p.value)
            return (
              <button
                key={p.value}
                type="button"
                disabled={support === "unsupported"}
                onClick={() => togglePlatform(p.value)}
                className={`px-4 py-2 rounded-md text-white flex items-center gap-1
                  ${support === "unsupported" ? 'bg-gray-300 opacity-50 cursor-not-allowed' :
                    selectedPlatforms.includes(p.value) ? p.color : 'bg-gray-500'}
                  ${support === "warning" ? 'border-yellow-400 border' : ''}`}
              >
                {p.label}
                {support === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-300" />}
              </button>
            )
          })}
        </div>
        {errors.platforms && <p className="text-red-500 text-sm">{errors.platforms}</p>}
      </div>

      {/* Media */}
      <div>
        <Label>Media</Label>
        <div className="grid grid-cols-2 gap-4">
          {media.map((m, i) => (
            <div key={i} className="relative border rounded-lg p-2">
              {m.type === 'video'
                ? <div className="aspect-video flex items-center justify-center bg-gray-200"><Video /></div>
                : <img src={m.url} className="w-full aspect-video object-cover rounded" />}
              <Button type="button" size="sm" variant="destructive"
                onClick={() => removeMedia(i)} className="absolute top-1 right-1">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="border-2 border-dashed rounded-lg p-4">
            <MediaUpload
              folder="posts"
              onChange={addMedia}
              type={["video", "reel", "short"].includes(contentType) ? "video" : "image"}
              maxSize={["video", "reel", "short"].includes(contentType) ? 500 : 10}
            />
          </div>

        </div>
      </div>

      {/* Hashtags */}
      <div>
        <Label htmlFor="hashtags">Hashtags (space-separated)</Label>
        <Input id="hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
      </div>

      {/* Schedule */}
      <div>
        <Label htmlFor="scheduledAt">Schedule (optional)</Label>
        <Input type="datetime-local" id="scheduledAt" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onClose && <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>}
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? <><Loader2 className="animate-spin" /> Saving...</> : post ? 'Update Post' : 'Create Post'}
        </Button>
      </div>
    </form>
  )
}
