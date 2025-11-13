import Redis from 'ioredis'

/**
 * Test helper for Redis integration tests
 * Uses the REDIS_URL from environment or defaults to localhost
 */
export class RedisTestHelper {
  private static instance: Redis | null = null
  private static connectionChecked = false
  private static connectionAvailable = false

  static getConnection(): Redis {
    if (!this.instance || this.instance.status === 'end') {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: false,
        enableReadyCheck: true,
        retryStrategy: (times) => {
          // Stop retrying after first attempt for tests
          if (times > 1) return null
          return 100
        },
        // Add connection event handlers
        reconnectOnError: (err) => {
          console.warn('Redis reconnect on error:', err.message)
          return false // Don't reconnect on error in tests
        },
      })

      // Reset connection state when connection closes
      this.instance.on('close', () => {
        this.connectionChecked = false
        this.connectionAvailable = false
      })

      this.instance.on('error', (err) => {
        console.warn('Redis connection error:', err.message)
        this.connectionChecked = false
        this.connectionAvailable = false
      })
    }
    return this.instance
  }

  static async connect(): Promise<void> {
    const redis = this.getConnection()
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      await redis.connect()
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance && this.instance.status !== 'end') {
      try {
        await this.instance.quit()
      } catch (error) {
        // Ignore errors during quit
        try {
          this.instance.disconnect()
        } catch {
          // Ignore
        }
      }
      this.instance = null
      this.connectionChecked = false
      this.connectionAvailable = false
    }
  }

  static async flushAll(): Promise<void> {
    const redis = this.getConnection()
    await redis.flushall()
  }

  static async cleanup(pattern: string = '*'): Promise<void> {
    try {
      const redis = this.getConnection()
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  static async isConnected(): Promise<boolean> {
    // Cache the connection check result
    if (this.connectionChecked) {
      return this.connectionAvailable
    }

    try {
      const redis = this.getConnection()
      await redis.ping()
      this.connectionChecked = true
      this.connectionAvailable = true
      return true
    } catch {
      this.connectionChecked = true
      this.connectionAvailable = false
      // Close the failed connection
      if (this.instance) {
        try {
          this.instance.disconnect()
        } catch {
          // Ignore
        }
        this.instance = null
      }
      return false
    }
  }

  static async forceReconnect(): Promise<void> {
    // Force close current connection
    if (this.instance) {
      try {
        await this.instance.quit()
      } catch {
        // Ignore
      }
      this.instance = null
      this.connectionChecked = false
      this.connectionAvailable = false
    }

    // Create new connection
    const redis = this.getConnection()
    if (redis.status !== 'ready') {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Redis connection timeout')), 5000)

        redis.once('ready', () => {
          clearTimeout(timeout)
          resolve()
        })

        redis.once('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })
      })
    }
  }
}
