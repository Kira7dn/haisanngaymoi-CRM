/**
 * Refactored Cache Service for Episodic Memory
 * - Promise-aware (avoid duplicate creation/update)
 * - Consistent TTL handling
 * - No background side effects unless enabled
 * - Keeps existing public API semantics
 */

import { CacheEntry, GenerationSession, ICacheService } from "@/core/application/usecases/marketing/post/generate-post/post-gen-service.interfaces"

const DEFAULT_TTL_MS = 30 * 60 * 1000 // 30 minutes

export class CacheService implements ICacheService {
  private readonly store = new Map<string, CacheEntry<any>>()

  /**
   * Track in-flight operations per key to avoid logical race conditions
   */
  private readonly inflight = new Map<string, Promise<any>>()

  private readonly defaultTTL: number
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(options?: { defaultTTL?: number; enableCleanup?: boolean }) {
    this.defaultTTL = options?.defaultTTL ?? DEFAULT_TTL_MS

    if (options?.enableCleanup !== false) {
      this.startCleanup()
    }
  }

  /* ----------------------------------
   * Core cache primitives
   * ---------------------------------- */

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key)
    if (!entry) return undefined

    if (this.isExpired(entry)) {
      this.store.delete(key)
      return undefined
    }

    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
    })
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key)
    if (!entry) return false

    if (this.isExpired(entry)) {
      this.store.delete(key)
      return false
    }

    return true
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  async size(): Promise<number> {
    return this.store.size
  }

  /* ----------------------------------
   * Generation session helpers
   * ---------------------------------- */

  async getOrCreateSession(
    sessionId: string,
    metadata?: { idea?: string; productId?: string }
  ): Promise<GenerationSession> {
    return this.runExclusive(sessionId, async () => {
      const existing = await this.get<GenerationSession>(sessionId)
      if (existing) return existing

      const now = new Date()

      const session: GenerationSession = {
        sessionId,
        metadata: {
          idea: metadata?.idea,
          productId: metadata?.productId,
          startedAt: now,
          lastUpdatedAt: now,
        },
        expiresAt: new Date(now.getTime() + this.defaultTTL),
      }

      await this.set(sessionId, session)
      return session
    })
  }

  async updateSession(
    sessionId: string,
    updates: Partial<GenerationSession>
  ): Promise<GenerationSession | null> {
    return this.runExclusive(sessionId, async () => {
      const session = await this.get<GenerationSession>(sessionId)
      if (!session) return null

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
    })
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.delete(sessionId)
  }

  async getActiveSessions(): Promise<string[]> {
    const now = Date.now()
    const result: string[] = []

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt >= now && entry.value && typeof entry.value === 'object' && 'sessionId' in entry.value) {
        result.push(key)
      }
    }

    return result
  }

  /* ----------------------------------
   * Internal helpers
   * ---------------------------------- */

  private isExpired(entry: CacheEntry<any>): boolean {
    return entry.expiresAt < Date.now()
  }

  /**
   * Ensure only one async operation per key at a time
   */
  private async runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.inflight.has(key)) {
      return this.inflight.get(key) as Promise<T>
    }

    const promise = fn().finally(() => {
      this.inflight.delete(key)
    })

    this.inflight.set(key, promise)
    return promise
  }

  /* ----------------------------------
   * Cleanup
   * ---------------------------------- */

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key)
      }
    }
  }
}

/* ----------------------------------
 * Singleton factory
 * ---------------------------------- */

let instance: CacheService | null = null

export function getCacheService(): CacheService {
  if (!instance) {
    instance = new CacheService()
  }
  return instance
}
