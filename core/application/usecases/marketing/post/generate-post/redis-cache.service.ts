/**
 * Cache Service for Episodic Memory
 * Stores intermediate results during multi-pass content generation
 * Uses Upstash Redis with HTTP/REST API for serverless compatibility
 */

import { Redis } from "@upstash/redis"
import { GenerationSession, ICacheService } from "@/core/application/usecases/marketing/post/generate-post/post-gen-service.interfaces"

/**
 * Cache Service using Upstash Redis
 * Connectionless HTTP-based Redis client optimized for serverless/edge environments
 */
export class RedisCacheService implements ICacheService {
  private redis: Redis
  private readonly defaultTTL = 30 * 60 // 30 minutes in seconds (Upstash uses seconds, not milliseconds)

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error(
        "Missing Upstash Redis credentials. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables."
      )
    }

    this.redis = new Redis({
      url,
      token,
    })
  }

  /**
   * Set cache entry with TTL
   * Uses Redis EX (seconds) for automatic expiration
   * Upstash Redis automatically handles JSON serialization
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const ttlSeconds = ttl ? Math.floor(ttl / 1000) : this.defaultTTL
    await this.redis.set(key, value, { ex: ttlSeconds })
  }

  /**
   * Get cache entry
   * Returns undefined if not found or expired (Redis handles expiration automatically)
   * Upstash Redis automatically handles JSON deserialization
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const result = await this.redis.get<T>(key)
      return result ?? undefined
    } catch (error) {
      console.error(`[RedisCacheService] Failed to get cached value for key "${key}":`, error)
      return undefined
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key)
    return exists === 1
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.redis.del(key)
    return result === 1
  }

  /**
   * Clear all cache entries
   * WARNING: This uses FLUSHDB which clears the entire database
   * Use with caution in production environments
   */
  async clear(): Promise<void> {
    await this.redis.flushdb()
  }

  /**
   * Get cache size
   * Returns the number of keys in the database
   */
  async size(): Promise<number> {
    return await this.redis.dbsize()
  }

  /**
   * Get or create generation session
   */
  async getOrCreateSession(
    sessionId: string,
    metadata?: { idea?: string; productId?: string }
  ): Promise<GenerationSession> {
    const existing = await this.get<GenerationSession>(sessionId)

    if (existing) {
      return existing
    }

    const now = new Date()
    const session: GenerationSession = {
      sessionId,
      metadata: {
        idea: metadata?.idea,
        productId: metadata?.productId,
        startedAt: now,
        lastUpdatedAt: now,
      },
      expiresAt: new Date(now.getTime() + this.defaultTTL * 1000),
    }

    await this.redis.set(
      sessionId,
      session,
      { ex: this.defaultTTL, nx: true }
    )

    return session
  }

  /**
   * Update generation session
   */
  async updateSession(sessionId: string, updates: Partial<GenerationSession>): Promise<GenerationSession | null> {
    const session = await this.get<GenerationSession>(sessionId)

    if (!session) {
      return null
    }

    const updated: GenerationSession = {
      ...session,
      ...updates,
      metadata: {
        ...session.metadata,
        ...updates.metadata,
        lastUpdatedAt: new Date(),
      },
    }

    await this.set(sessionId, updated)
    return updated
  }

  /**
   * Delete generation session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    return await this.delete(sessionId)
  }

  /**
   * Get all active session IDs
   * Uses Redis SCAN for efficient key iteration
   */
  async getActiveSessions(): Promise<string[]> {
    const sessions: string[] = []
    let cursor = 0

    do {
      // Scan for all keys (you may want to add a pattern like "session:*" for better organization)
      const result = await this.redis.scan(cursor, { count: 100 })
      cursor = parseInt(result[0])
      const keys = result[1]

      for (const key of keys) {
        const value = await this.get<GenerationSession>(key)
        if (value && typeof value === 'object' && 'sessionId' in value) {
          sessions.push(key)
        }
      }
    } while (cursor !== 0)

    return sessions
  }
}

/**
 * Singleton instance
 */
let cacheServiceInstance: RedisCacheService | null = null

/**
 * Get Redis Cache Service instance
 */
export function getCacheService(): RedisCacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new RedisCacheService()
  }
  return cacheServiceInstance
}
