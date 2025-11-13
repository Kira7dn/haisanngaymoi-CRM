import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { Queue, QueueEvents, Worker } from 'bullmq'
import { RedisTestHelper } from '@/infrastructure/db/__tests__/redis-test-helper'
import type { PaymentGateway } from '@/core/application/interfaces/payment-gateway'

describe('Queue Event Listeners (Integration)', () => {
  let testQueue: Queue
  let testQueueEvents: QueueEvents
  let testWorker: Worker
  let mockPaymentGateway: PaymentGateway

  beforeAll(async () => {
    // Ensure Redis is available
    const isConnected = await RedisTestHelper.isConnected()
    if (!isConnected) {
      throw new Error('Redis is not available. Please start Redis server for integration tests.')
    }

    // Set Redis URL for tests
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
  }, 30000)

  beforeEach(async () => {
    // Clean up any existing test queues
    await RedisTestHelper.cleanup('bull:queue-event-test:*')

    const redis = RedisTestHelper.getConnection()

    // Create mock payment gateway
    mockPaymentGateway = {
      checkPaymentStatus: vi.fn().mockResolvedValue({
        success: true,
        status: 'success',
        data: {},
      }),
      processPaymentUpdate: vi.fn().mockResolvedValue(undefined),
    }

    // Create test queue
    testQueue = new Queue('queue-event-test', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    })

    // Create queue events
    testQueueEvents = new QueueEvents('queue-event-test', {
      connection: redis,
    })

    // Create test worker
    testWorker = new Worker(
      'queue-event-test',
      async (job) => {
        const { type, data } = job.data

        switch (type) {
          case 'checkPaymentStatus':
            const { orderId, checkoutSdkOrderId, miniAppId } = data
            await mockPaymentGateway.processPaymentUpdate(orderId, checkoutSdkOrderId, miniAppId)
            break
          default:
            throw new Error(`Unknown job type: ${type}`)
        }
      },
      {
        connection: redis,
        concurrency: 5,
      }
    )
  })

  afterEach(async () => {
    // Close worker, queue events, and queue
    await testWorker.close()
    await testQueueEvents.close()
    await testQueue.close()

    // Clean up Redis keys
    await RedisTestHelper.cleanup('bull:queue-event-test:*')

    // Clear mocks
    vi.clearAllMocks()
  })

  afterAll(async () => {
    // Disconnect Redis
    await RedisTestHelper.disconnect()
  }, 30000)

  describe('Order Queue Events', () => {
    it('should emit completed event when job succeeds', async () => {
      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 12345,
          checkoutSdkOrderId: 'checkout_12345',
          miniAppId: 'test-app',
        },
      }

      // Add job to queue
      const job = await testQueue.add('checkPaymentStatus', jobData)

      // Wait for job completion event
      const completed = await new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(false), 15000)

        const onCompleted = ({ jobId }: any) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            resolve(true)
          }
        }

        const onFailed = ({ jobId, failedReason }: any) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            reject(new Error(`Job failed: ${failedReason}`))
          }
        }

        testQueueEvents.on('completed', onCompleted)
        testQueueEvents.on('failed', onFailed)
      })

      expect(completed).toBe(true)
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledWith(
        12345,
        'checkout_12345',
        'test-app'
      )
    }, 20000)

    it('should emit failed event when job fails', async () => {
      // Mock payment gateway to throw error
      mockPaymentGateway.processPaymentUpdate = vi
        .fn()
        .mockRejectedValue(new Error('Payment gateway error'))

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 99999,
          checkoutSdkOrderId: 'checkout_99999',
        },
      }

      // Add job to queue
      const job = await testQueue.add('checkPaymentStatus', jobData)

      // Wait for job failure event
      const result = await new Promise<{ failed: boolean; reason: string }>((resolve) => {
        const timeout = setTimeout(
          () => resolve({ failed: false, reason: 'timeout' }),
          15000
        )

        const onFailed = ({ jobId, failedReason }: any) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            resolve({ failed: true, reason: failedReason })
          }
        }

        const onCompleted = ({ jobId }: any) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            resolve({ failed: false, reason: 'completed unexpectedly' })
          }
        }

        testQueueEvents.on('failed', onFailed)
        testQueueEvents.on('completed', onCompleted)
      })

      expect(result.failed).toBe(true)
      expect(result.reason).toContain('Payment gateway error')
    }, 20000)

    it('should handle multiple concurrent jobs', async () => {
      const jobs = await Promise.all([
        testQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: 1, checkoutSdkOrderId: 'checkout_1' },
        }),
        testQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: 2, checkoutSdkOrderId: 'checkout_2' },
        }),
        testQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: 3, checkoutSdkOrderId: 'checkout_3' },
        }),
      ])

      const completedJobIds = new Set<string>()

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Jobs timeout')), 15000)

        testQueueEvents.on('completed', ({ jobId }) => {
          completedJobIds.add(jobId)
          if (completedJobIds.size === jobs.length) {
            clearTimeout(timeout)
            resolve()
          }
        })

        testQueueEvents.on('failed', ({ jobId, failedReason }) => {
          clearTimeout(timeout)
          reject(new Error(`Job ${jobId} failed: ${failedReason}`))
        })
      })

      expect(completedJobIds.size).toBe(3)
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledTimes(3)
    }, 20000)

    it('should handle delayed jobs', async () => {
      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 54321,
          checkoutSdkOrderId: 'checkout_54321',
        },
      }

      const startTime = Date.now()
      const delay = 2000

      // Add delayed job
      const job = await testQueue.add('checkPaymentStatus', jobData, { delay })

      // Wait for job completion
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Delayed job timeout')), 10000)

        testQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })

        testQueueEvents.on('failed', ({ jobId, failedReason }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            reject(new Error(`Job failed: ${failedReason}`))
          }
        })
      })

      const endTime = Date.now()
      const actualDelay = endTime - startTime

      // Job should have been delayed by at least the specified delay
      expect(actualDelay).toBeGreaterThanOrEqual(delay)
    }, 15000)
  })
})
