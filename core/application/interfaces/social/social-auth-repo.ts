import { Platform } from "@/core/domain/marketing/post";
import type { SocialAuth } from "@/core/domain/social/social-auth";
import { ObjectId } from "mongodb";

/**
 * Payload for creating/updating SocialAuth domain object
 */
export interface SocialAuthPayload extends Partial<SocialAuth> { }

/**
 * Payload for refreshing token & updating DB
 */
export interface RefreshTokenPayload {
  userId: ObjectId;
  platform: Platform;
  newAccessToken: string;
  newRefreshToken?: string;   // some platforms don't return refresh token
  expiresInSeconds: number;
}

/**
 * Social Authentication Repository Interface
 * Handles all database operations for SocialAuth
 * (UseCases orchestrate flow; repo only does persistence)
 */
export interface SocialAuthRepo {
  /** ──────────────────────────────────────────────────────────────
   * Basic CRUD Operations
   * ───────────────────────────────────────────────────────────────
   */
  getById(id: ObjectId): Promise<SocialAuth | null>;

  getByUserAndPlatform(
    userId: ObjectId,
    platform: Platform
  ): Promise<SocialAuth | null>;

  getByChannelAndPlatform(
    channelId: string,
    platform: Platform
  ): Promise<SocialAuth | null>;

  create(payload: SocialAuthPayload): Promise<SocialAuth>;

  update(payload: SocialAuthPayload & { id: ObjectId }): Promise<SocialAuth | null>;

  delete(id: ObjectId): Promise<boolean>;

  /** ──────────────────────────────────────────────────────────────
   * Platform-Specific Operations
   * ───────────────────────────────────────────────────────────────
   */
  deleteByUserAndPlatform(
    userId: ObjectId,
    platform: Platform
  ): Promise<boolean>;

  /**
   * Refresh token and update DB with new token values
   * (UseCase computes "expiresAt" based on expiresInSeconds)
   */
  refreshToken(payload: RefreshTokenPayload): Promise<SocialAuth | null>;

  getAllByUser(userId: ObjectId): Promise<SocialAuth[]>;

  getAllByPlatform(platform: Platform): Promise<SocialAuth[]>;
}
