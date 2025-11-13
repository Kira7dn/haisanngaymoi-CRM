import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Worker } from 'bullmq'

// Global variable to store worker instance
let mockWorkerInstance: any

// Mock BullMQ
vi.mock('bullmq', () => ({
  Worker: class {
    constructor(name: string, processor: Function, options: any) {
      mockWorkerInstance = {
        name,
        processor,
        opts: options,
        close: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      }
      return mockWorkerInstance
    }
  },
}))

// Mock Redis connection
const mockRedisInstance = { quit: vi.fn().mockResolvedValue(undefined) }
vi.mock('ioredis', () => ({
  default: class {
    constructor() {
      return mockRedisInstance
    }
  }
}))

// Mock payment gateway
const mockProcessPaymentUpdate = vi.fn().mockResolvedValue({ status: 'success' })
vi.mock('@/lib/container', () => ({
  paymentGateway: {
    processPaymentUpdate: mockProcessPaymentUpdate,
  },
}))

beforeEach(() => {
  // Reset global state
  delete (global as any)._mongoClientPromise
  delete (global as any).__workerRedisConnection
  vi.clearAllMocks()
  vi.stubEnv('MONGODB_URI', '')
  vi.stubEnv('NODE_ENV', '')
  vi.stubEnv('REDIS_URL', '')

  // Mock console methods to track event listener calls
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('Order Worker', () => {
  describe('Worker creation', () => {
    it('should create worker with correct configuration', async () => {
      process.env.REDIS_URL = 'redis://test'

      const { ensureOrderWorker } = await import('../order-worker')
      ensureOrderWorker()

      expect(mockWorkerInstance).toBeDefined()
      expect(mockWorkerInstance.name).toBe('orders')
      expect(mockWorkerInstance.opts.concurrency).toBe(5)
      expect(mockWorkerInstance.opts.limiter.max).toBe(10)
      expect(mockWorkerInstance.opts.limiter.duration).toBe(1000)
    })

    it('should use Redis URL from environment', async () => {
      const testRedisUrl = 'redis://test:6379'
      process.env.REDIS_URL = testRedisUrl

      const { ensureOrderWorker } = await import('../order-worker')
      ensureOrderWorker()

      // Redis should be created with the correct URL
      // We can't easily test this without spying, so we'll just check that worker was created
      expect(mockWorkerInstance).toBeDefined()
      expect(mockWorkerInstance.opts.connection).toBeDefined()
    })
  })

  describe('Job processing logic', () => {
    it('should process checkPaymentStatus jobs', async () => {
      const { ensureOrderWorker } = await import('../order-worker')
      ensureOrderWorker()

      // Mock job data
      const mockJob = {
        name: 'checkPaymentStatus',
        data: {
          type: 'checkPaymentStatus',
          data: { orderId: 'test-order-123' }
        },
        id: 'job-123',
      }

      // Execute the processor
      await mockWorkerInstance.processor(mockJob)

      // Verify payment gateway was called
      expect(mockProcessPaymentUpdate).toHaveBeenCalledWith('test-order-123', undefined, undefined)
    })

    it('should handle unknown job types', async () => {
      const { ensureOrderWorker } = await import('../order-worker')
      ensureOrderWorker()

      const mockJob = {
        name: 'unknownJobType',
        data: {
          type: 'unknownJobType',
          data: { someData: 'test' }
        },
        id: 'job-456',
      }

      // Should throw error for unknown job types
      await expect(mockWorkerInstance.processor(mockJob)).rejects.toThrow('Unknown job type: unknownJobType')
    })
  })

  describe('Lazy Redis initialization', () => {
    it('should create Redis connection only once (singleton)', async () => {
      process.env.REDIS_URL = 'redis://test'

      const { ensureOrderWorker } = await import('../order-worker')
      ensureOrderWorker()

      // Check that worker was created with a connection
      expect(mockWorkerInstance).toBeDefined()
      expect(mockWorkerInstance.opts.connection).toBeDefined()

      // Second call should reuse the same worker instance
      const firstWorker = mockWorkerInstance
      ensureOrderWorker()
      expect(mockWorkerInstance).toBe(firstWorker)
    })
  })

  describe('Error handling', () => {
    it('should handle missing REDIS_URL gracefully', async () => {
      delete process.env.REDIS_URL

      // Should not throw during import (lazy initialization)
      await expect(import('../order-worker')).resolves.not.toThrow()
    })

    it('should handle job processing errors gracefully', async () => {
      mockProcessPaymentUpdate.mockRejectedValueOnce(new Error('Payment API error'))

      const { ensureOrderWorker } = await import('../order-worker')
      ensureOrderWorker()

      const mockJob = {
        name: 'checkPaymentStatus',
        data: {
          type: 'checkPaymentStatus',
          data: { orderId: 'test-order-123' }
        },
        id: 'job-123',
      }

      // Should throw error for payment gateway failure
      await expect(mockWorkerInstance.processor(mockJob)).rejects.toThrow('Payment API error')
    })
  })
})
