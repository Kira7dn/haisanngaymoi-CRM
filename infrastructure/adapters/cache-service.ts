/**
 * Cache Service for Episodic Memory
 * Stores intermediate results during multi-pass content generation
 * Uses in-memory Map with TTL (Time To Live)
 */

/**
 * Generation Session stored in cache
 */
export interface GenerationSession {
  sessionId: string
  ideaPass?: {
    ideas: string[]
    selectedIdea: string
  }
  anglePass?: {
    angles: string[]
    selectedAngle: string
  }
  outlinePass?: {
    outline: string
    sections: string[]
  }
  draftPass?: {
    draft: string
    wordCount: number
  }
  enhancePass?: {
    enhanced: string
    improvements: string[]
  }
  metadata: {
    topic?: string
    platform?: string
    startedAt: Date
    lastUpdatedAt: Date
  }
  expiresAt: Date
}

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  value: T
  expiresAt: number
}

/**
 * Cache Service using in-memory Map
 */
export class CacheService {
  private cache: Map<string, CacheEntry<any>>
  private readonly defaultTTL = 30 * 60 * 1000 // 30 minutes in milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.cache = new Map()
    this.startCleanupInterval()
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Stop cleanup interval
   */
  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))

    if (expiredKeys.length > 0) {
      console.log(`[CacheService] Cleaned up ${expiredKeys.length} expired entries`)
    }
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, {
      value,
      expiresAt,
    })
  }

  /**
   * Get cache entry
   * Returns undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value as T
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Get or create generation session
   */
  getOrCreateSession(
    sessionId: string,
    metadata?: { topic?: string; platform?: string }
  ): GenerationSession {
    const existing = this.get<GenerationSession>(sessionId)

    if (existing) {
      return existing
    }

    const now = new Date()
    const session: GenerationSession = {
      sessionId,
      metadata: {
        topic: metadata?.topic,
        platform: metadata?.platform,
        startedAt: now,
        lastUpdatedAt: now,
      },
      expiresAt: new Date(now.getTime() + this.defaultTTL),
    }

    this.set(sessionId, session)
    return session
  }

  /**
   * Update generation session
   */
  updateSession(sessionId: string, updates: Partial<GenerationSession>): GenerationSession | null {
    const session = this.get<GenerationSession>(sessionId)

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

    this.set(sessionId, updated)
    return updated
  }

  /**
   * Delete generation session
   */
  deleteSession(sessionId: string): boolean {
    return this.delete(sessionId)
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions(): string[] {
    const now = Date.now()
    const sessions: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt >= now && typeof entry.value === 'object' && 'sessionId' in entry.value) {
        sessions.push(key)
      }
    }

    return sessions
  }
}

/**
 * Singleton instance
 */
let cacheServiceInstance: CacheService | null = null

/**
 * Get Cache Service instance
 */
export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService()
  }
  return cacheServiceInstance
}
