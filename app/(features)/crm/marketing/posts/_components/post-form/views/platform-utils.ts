import type { Platform, ContentType, PlatformMetadata } from '@/core/domain/marketing/post'

/**
 * Platform Utility Functions
 *
 * Centralized logic for:
 * - Content type auto-detection
 * - Platform compatibility checking
 * - Platform filtering
 * - Platform colors for badges
 */

// ========== Types ==========

export type PlatformCompatibility = "supported" | "warning" | "unsupported"

export interface PlatformOption {
  value: Platform
  label: string
}

// ========== Constants ==========

/**
 * Platform list with display labels
 */
export const PLATFORMS: PlatformOption[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Website' },
  { value: 'telegram', label: 'Telegram' },
]

/**
 * Platform color mapping for badges
 */
export const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: 'bg-blue-600 text-white',
  youtube: 'bg-red-600 text-white',
  tiktok: 'bg-black text-white dark:bg-gray-900',
  zalo: 'bg-blue-400 text-white',
  wordpress: 'bg-[#21759B] text-white',
  instagram: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
  website: 'bg-gray-600 text-white',
  telegram: 'bg-sky-500 text-white',
}

/**
 * Content type to platform compatibility mapping
 *
 * - supported: Platform fully supports this content type
 * - warning: Platform supports with limitations (show warning icon)
 * - unsupported: Platform does not support this content type (disabled)
 */
export const CONTENT_PLATFORM_MAP: Record<ContentType, Record<Platform, PlatformCompatibility>> = {
  short: {
    facebook: "supported",    // Reels
    youtube: "supported",     // Shorts
    tiktok: "supported",      // TikTok videos
    zalo: "unsupported",
    website: "unsupported",
    telegram: "unsupported",
    wordpress: "unsupported",
    instagram: "supported"    // Reels
  },
  post: {
    facebook: "supported",    // Photo posts
    youtube: "unsupported",
    tiktok: "warning",        // Can post images but limited
    zalo: "supported",        // Zalo OA posts
    website: "supported",
    telegram: "supported",
    wordpress: "supported",   // Blog posts
    instagram: "supported"    // Feed posts
  },
  video: {
    facebook: "supported",    // Long videos
    youtube: "supported",     // Full videos
    tiktok: "unsupported",
    zalo: "unsupported",
    website: "supported",
    telegram: "unsupported",
    wordpress: "warning",     // Embedded videos
    instagram: "supported"    // IGTV/Video posts
  },
  story: {
    facebook: "supported",    // Stories
    youtube: "unsupported",
    tiktok: "supported",      // TikTok stories
    zalo: "unsupported",
    website: "unsupported",
    telegram: "unsupported",
    wordpress: "unsupported",
    instagram: "supported"    // Stories
  },
}

// ========== Utility Functions ==========

/**
 * Auto-detect content type from uploaded file MIME type
 *
 * @param mimeType - File MIME type (e.g., "video/mp4", "image/jpeg")
 * @returns Detected content type ('short' for videos, 'post' for images)
 *
 * @example
 * autoDetectContentType('video/mp4') // => 'short'
 * autoDetectContentType('image/png') // => 'post'
 */
export function autoDetectContentType(mimeType: string): ContentType {
  if (mimeType.startsWith('video/')) {
    return 'short' // Videos default to Reels/Shorts format
  }
  return 'post' // Images default to Photo Posts
}

/**
 * Get platform compatibility status for a given content type
 *
 * @param platform - Platform to check
 * @param contentType - Content type to validate against
 * @returns Compatibility status
 *
 * @example
 * getPlatformCompatibility('facebook', 'short') // => 'supported'
 * getPlatformCompatibility('zalo', 'short') // => 'unsupported'
 */
export function getPlatformCompatibility(
  platform: Platform,
  contentType: ContentType
): PlatformCompatibility {
  return CONTENT_PLATFORM_MAP[contentType]?.[platform] || 'unsupported'
}

/**
 * Check if a platform is compatible with a content type
 * Compatible means 'supported' or 'warning' (not 'unsupported')
 *
 * @param platform - Platform to check
 * @param contentType - Content type to validate against
 * @returns True if platform can be used with this content type
 *
 * @example
 * isPlatformCompatible('facebook', 'short') // => true
 * isPlatformCompatible('zalo', 'short') // => false
 */
export function isPlatformCompatible(
  platform: Platform,
  contentType: ContentType
): boolean {
  const status = getPlatformCompatibility(platform, contentType)
  return status === 'supported' || status === 'warning'
}

/**
 * Filter platform list to only include compatible platforms
 * Removes platforms that are 'unsupported' for the given content type
 *
 * @param platforms - List of platform metadata to filter
 * @param contentType - Content type to filter by
 * @returns Filtered list of compatible platforms
 *
 * @example
 * const platforms = [
 *   { platform: 'facebook', metadata: {} },
 *   { platform: 'zalo', metadata: {} }
 * ]
 * filterCompatiblePlatforms(platforms, 'short')
 * // => [{ platform: 'facebook', metadata: {} }]
 */
export function filterCompatiblePlatforms(
  platforms: PlatformMetadata[],
  contentType: ContentType
): PlatformMetadata[] {
  return platforms.filter(p => isPlatformCompatible(p.platform, contentType))
}

/**
 * Get platform label by platform value
 *
 * @param platform - Platform value
 * @returns Human-readable platform name
 *
 * @example
 * getPlatformLabel('facebook') // => 'Facebook'
 */
export function getPlatformLabel(platform: Platform): string {
  return PLATFORMS.find(p => p.value === platform)?.label || platform
}

/**
 * Get all compatible platforms for a content type
 * Returns list of platforms that are 'supported' or 'warning'
 *
 * @param contentType - Content type to get platforms for
 * @returns Array of compatible platform values
 *
 * @example
 * getCompatiblePlatforms('short')
 * // => ['facebook', 'youtube', 'tiktok', 'instagram']
 */
export function getCompatiblePlatforms(contentType: ContentType): Platform[] {
  return PLATFORMS
    .map(p => p.value)
    .filter(platform => isPlatformCompatible(platform, contentType))
}
