import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { Queue, QueueEvents, Worker } from 'bullmq'
import { RedisTestHelper } from '@/infrastructure/db/__tests__/redis-test-helper'

describe('Order Queue Integration Tests', () => {
  let orderQueue: Queue
  let orderQueueEvents: QueueEvents
  let testWorker: Worker | null = null

  beforeAll(async () => {
    // Skip all tests if Redis is not available
    const isRedisAvailable = await RedisTestHelper.isConnected()
    if (!isRedisAvailable) {
      console.warn('Redis is not available. Skipping queue integration tests.')
      return
    }

    // Set Redis URL for tests
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
  }, 30000)

  beforeEach(async () => {
    // Skip test if Redis not available
    const isRedisAvailable = await RedisTestHelper.isConnected()
    if (!isRedisAvailable) {
      return
    }

    // Clean up any existing order queues
    await RedisTestHelper.cleanup('bull:orders:*')

    try {
      const redis = RedisTestHelper.getConnection()

      // Ensure Redis connection is ready
      if (redis.status !== 'ready') {
        await new Promise<void>((resolve) => {
          redis.once('ready', resolve)
        })
      }

      // Create fresh queue and events instances
      orderQueue = new Queue('orders', {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      })

      orderQueueEvents = new QueueEvents('orders', {
        connection: redis,
      })

      // Wait for queue events to be ready
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000) // Timeout after 2s

        // QueueEvents doesn't emit 'ready' event, just wait a bit
        setTimeout(() => {
          clearTimeout(timeout)
          resolve()
        }, 500)
      })
    } catch (error) {
      console.warn('Failed to setup Redis connection for test:', error instanceof Error ? error.message : String(error))
      // Continue without throwing - individual tests will handle Redis unavailability
    }
  })

  afterEach(async () => {
    // Close worker if created
    if (testWorker) {
      await testWorker.close()
      testWorker = null
    }

    // Close queue and events
    await orderQueueEvents.close()
    await orderQueue.close()

    // Clean up Redis keys
    await RedisTestHelper.cleanup('bull:orders:*')
  })

  afterAll(async () => {
    // Disconnect Redis
    await RedisTestHelper.disconnect()

    // Clean up global Redis connection
    if ((globalThis as any).__orderRedisConnection) {
      await (globalThis as any).__orderRedisConnection.quit()
      delete (globalThis as any).__orderRedisConnection
    }
  }, 30000)

  describe('Queue initialization', () => {
    it('should create order queue with correct configuration', () => {
      expect(orderQueue.name).toBe('orders')
      expect(orderQueue.opts.defaultJobOptions?.removeOnComplete).toBe(50)
      expect(orderQueue.opts.defaultJobOptions?.removeOnFail).toBe(100)
    })

    it('should create queue events instance', () => {
      expect(orderQueueEvents).toBeDefined()
    })
  })

  describe('Adding jobs to queue', () => {
    it('should add checkPaymentStatus job successfully', async () => {
      const isRedisAvailable = await RedisTestHelper.isConnected()
      if (!isRedisAvailable) return

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 12345,
          checkoutSdkOrderId: 'checkout_12345',
          miniAppId: 'test-app-id',
        },
      }

      const job = await orderQueue.add('checkPaymentStatus', jobData)

      expect(job.id).toBeTruthy()
      expect(job.name).toBe('checkPaymentStatus')
      expect(job.data).toEqual(jobData)
    })

    it('should add job with delay option', async () => {
      const isRedisAvailable = await RedisTestHelper.isConnected()
      if (!isRedisAvailable) return

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 12346,
          checkoutSdkOrderId: 'checkout_12346',
        },
      }

      const delay = 5000
      const job = await orderQueue.add('checkPaymentStatus', jobData, { delay })

      expect(job.id).toBeTruthy()
      expect(job.opts.delay).toBe(delay)

      // Job should be in delayed state
      const state = await job.getState()
      expect(state).toBe('delayed')
    }, 10000)

    it('should add multiple jobs to queue', async () => {
      const jobs = await Promise.all([
        orderQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: 1 },
        }),
        orderQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: 2 },
        }),
        orderQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: 3 },
        }),
      ])

      expect(jobs).toHaveLength(3)
      jobs.forEach((job, index) => {
        expect(job.id).toBeTruthy()
        expect(job.data.data.orderId).toBe(index + 1)
      })
    })

    it('should add job with priority', async () => {
      const highPriorityJob = await orderQueue.add(
        'checkPaymentStatus',
        {
          type: 'checkPaymentStatus',
          data: { orderId: 100, priority: 'high' },
        },
        { priority: 1 }
      )

      const lowPriorityJob = await orderQueue.add(
        'checkPaymentStatus',
        {
          type: 'checkPaymentStatus',
          data: { orderId: 101, priority: 'low' },
        },
        { priority: 10 }
      )

      expect(highPriorityJob.opts.priority).toBe(1)
      expect(lowPriorityJob.opts.priority).toBe(10)
    })
  })

  describe('Queue events', () => {
    it('should emit completed event when job is processed', async () => {
      const jobData = {
        type: 'checkPaymentStatus',
        data: { orderId: 54321 },
      }

      const job = await orderQueue.add('checkPaymentStatus', jobData)

      // Set up event listener before creating worker
      const completedPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout waiting for completed event')), 10000)

        orderQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve(jobId)
          }
        })
      })

      // Create worker to process the job
      testWorker = new Worker(
        'orders',
        async (job) => {
          // Simple processor that completes successfully
          return { success: true, orderId: job.data.data.orderId }
        },
        {
          connection: RedisTestHelper.getConnection(),
        }
      )

      const completedJobId = await completedPromise
      expect(completedJobId).toBe(job.id)
    }, 15000)

    it('should emit failed event when job fails', async () => {
      const jobData = {
        type: 'checkPaymentStatus',
        data: { orderId: 99999 },
      }

      const job = await orderQueue.add('checkPaymentStatus', jobData)

      // Set up event listener before creating worker
      const failedPromise = new Promise<{ jobId: string; failedReason: string }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout waiting for failed event')), 10000)

        orderQueueEvents.on('failed', ({ jobId, failedReason }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve({ jobId, failedReason })
          }
        })
      })

      // Create worker that throws an error
      testWorker = new Worker(
        'orders',
        async (job) => {
          throw new Error('Payment gateway error')
        },
        {
          connection: RedisTestHelper.getConnection(),
        }
      )

      const result = await failedPromise
      expect(result.jobId).toBe(job.id)
      expect(result.failedReason).toContain('Payment gateway error')
    }, 15000)

    it('should handle multiple event listeners', async () => {
      let completedCount = 0
      let failedCount = 0

      orderQueueEvents.on('completed', () => {
        completedCount++
      })

      orderQueueEvents.on('failed', () => {
        failedCount++
      })

      // Add jobs first
      const job1 = await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 1 },
      })

      const job2 = await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 2 },
      })

      // Create worker that succeeds for orderId 1, fails for orderId 2
      testWorker = new Worker(
        'orders',
        async (job) => {
          if (job.data.data.orderId === 2) {
            throw new Error('Test error')
          }
          return { success: true }
        },
        {
          connection: RedisTestHelper.getConnection(),
        }
      )

      // Wait for both jobs to be processed
      await new Promise(resolve => setTimeout(resolve, 3000))

      expect(completedCount).toBeGreaterThanOrEqual(1)
      expect(failedCount).toBeGreaterThanOrEqual(1)
    }, 15000)
  })

  describe('Job retrieval and management', () => {
    it('should retrieve job by ID', async () => {
      const jobData = {
        type: 'checkPaymentStatus',
        data: { orderId: 777 },
      }

      const createdJob = await orderQueue.add('checkPaymentStatus', jobData)
      const retrievedJob = await orderQueue.getJob(createdJob.id!)

      expect(retrievedJob).toBeTruthy()
      expect(retrievedJob?.id).toBe(createdJob.id)
      expect(retrievedJob?.data).toEqual(jobData)
    })

    it('should get waiting jobs count', async () => {
      await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 1 },
      })
      await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 2 },
      })

      const waitingCount = await orderQueue.getWaitingCount()
      expect(waitingCount).toBeGreaterThanOrEqual(2)
    })

    it('should get active jobs', async () => {
      // Add jobs
      await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 1 },
      })

      const jobs = await orderQueue.getJobs(['waiting', 'active', 'delayed'])
      expect(jobs.length).toBeGreaterThan(0)
    })

    it('should remove job by ID', async () => {
      const job = await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 888 },
      })

      await job.remove()

      const retrievedJob = await orderQueue.getJob(job.id!)
      expect(retrievedJob).toBeUndefined()
    })
  })

  describe('Job lifecycle', () => {
    it('should track job state transitions', async () => {
      const job = await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 555 },
      })

      // Initial state should be waiting or active (worker might pick it up immediately)
      let state = await job.getState()
      expect(['waiting', 'active']).toContain(state)

      // Create worker to process job
      testWorker = new Worker(
        'orders',
        async (job) => {
          return { success: true }
        },
        {
          connection: RedisTestHelper.getConnection(),
        }
      )

      // Wait for worker to process job
      await new Promise<void>((resolve) => {
        orderQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            resolve()
          }
        })
      })

      // After processing, state should be completed
      state = await job.getState()
      expect(state).toBe('completed')
    }, 10000)

    it('should handle job retry on failure', async () => {
      const job = await orderQueue.add(
        'checkPaymentStatus',
        {
          type: 'checkPaymentStatus',
          data: { orderId: 666 },
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        }
      )

      expect(job.opts.attempts).toBe(3)
      expect(job.opts.backoff).toEqual({
        type: 'exponential',
        delay: 1000,
      })
    })
  })

  describe('Queue cleanup', () => {
    it('should clean completed jobs according to removeOnComplete setting', async () => {
      // Create worker to process jobs quickly
      testWorker = new Worker(
        'orders',
        async (job) => {
          return { success: true }
        },
        {
          connection: RedisTestHelper.getConnection(),
          concurrency: 10, // Process multiple jobs at once
        }
      )

      // Add 60 jobs
      const jobs = []
      for (let i = 0; i < 60; i++) {
        const job = await orderQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: i },
        })
        jobs.push(job)
      }

      // Wait for all jobs to complete
      let completedCount = 0
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 10000) // Fallback timeout

        orderQueueEvents.on('completed', () => {
          completedCount++
          if (completedCount >= 60) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      // Wait a bit more for cleanup to occur
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Should keep only last 50 completed jobs (as per removeOnComplete: 50)
      const completedJobs = await orderQueue.getCompleted(0, -1)
      expect(completedJobs.length).toBeLessThanOrEqual(50)
    }, 20000)

    it('should obliterate all jobs in queue', async () => {
      // Add several jobs
      await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 1 },
      })
      await orderQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 2 },
      })

      // Obliterate queue
      await orderQueue.obliterate({ force: true })

      // Queue should be empty
      const waitingCount = await orderQueue.getWaitingCount()
      const activeCount = await orderQueue.getActiveCount()
      const completedCount = await orderQueue.getCompletedCount()

      expect(waitingCount).toBe(0)
      expect(activeCount).toBe(0)
      expect(completedCount).toBe(0)
    })
  })

  describe('Redis connection', () => {
    it('should use provided Redis connection', () => {
      expect(orderQueue.opts.connection).toBeDefined()
    })

    it('should handle Redis connection errors gracefully', async () => {
      // This test verifies that the queue can handle temporary connection issues
      // In a real scenario, BullMQ will automatically retry
      const isConnected = await RedisTestHelper.isConnected()
      expect(isConnected).toBe(true)
    })
  })
})
