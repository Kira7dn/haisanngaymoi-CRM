// Domain entity for Social Media Authentication (OAuth tokens)

import { ObjectId } from "mongodb"

export type SocialPlatform = "tiktok" | "facebook" | "youtube" | "zalo"

// Platform-specific configuration interface
export interface PlatformConfig {
  // Common fields
  webhookUrl?: string

  // Zalo-specific
  zalo?: {
    appId: string
    appSecret: string
    oaId: string
  }

  // TikTok-specific
  tiktok?: {
    clientKey: string
    clientSecret: string
  }

  // Facebook-specific
  facebook?: {
    appId: string
    appSecret: string
    pageId: string
    verifyToken?: string
  }

  // YouTube-specific (future)
  youtube?: {
    clientId: string
    clientSecret: string
  }
}

export class SocialAuth {
  constructor(
    public readonly id: ObjectId = new ObjectId(),
    public platform: SocialPlatform,
    public openId: string,
    public pageName: string,
    public accessToken: string,
    public refreshToken: string,
    public expiresAt: Date,
    public userId: ObjectId, // Reference to AdminUser
    public scope?: string, // OAuth scopes granted
    public platformConfig?: PlatformConfig, // Platform-specific configuration
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) { }
}

// Validation function for social auth creation/update
export function validateSocialAuth(auth: Partial<SocialAuth>): string[] {
  const errors: string[] = []

  // Platform validation
  if (!auth.platform) {
    errors.push("Platform is required")
  } else if (!["tiktok", "facebook", "youtube", "zalo"].includes(auth.platform)) {
    errors.push("Platform must be one of: tiktok, facebook, youtube, zalo")
  }

  // OpenId validation
  if (!auth.openId || auth.openId.trim().length === 0) {
    errors.push("OpenId is required")
  }

  // Page name validation
  if (!auth.pageName || auth.pageName.trim().length === 0) {
    errors.push("Page name is required")
  }

  // Access token validation
  if (!auth.accessToken || auth.accessToken.trim().length === 0) {
    errors.push("Access token is required")
  }

  // Refresh token validation
  if (!auth.refreshToken || auth.refreshToken.trim().length === 0) {
    errors.push("Refresh token is required")
  }

  // Expires at validation
  if (!auth.expiresAt) {
    errors.push("Expiration date is required")
  } else if (!(auth.expiresAt instanceof Date)) {
    errors.push("Expiration date must be a valid Date object")
  }

  // UserId validation
  if (!auth.userId) {
    errors.push("User ID is required")
  }

  return errors
}

// Helper function to check if token is expired
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt
}

// Helper function to calculate expiration date from seconds
export function calculateExpiresAt(expiresInSeconds: number): Date {
  const now = new Date()
  return new Date(now.getTime() + expiresInSeconds * 1000)
}
