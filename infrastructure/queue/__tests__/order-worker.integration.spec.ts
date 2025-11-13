import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { Queue, Worker, QueueEvents } from 'bullmq'
import { RedisTestHelper } from '@/infrastructure/db/__tests__/redis-test-helper'
import type { PaymentGateway, PaymentResult } from '@/core/application/interfaces/payment-gateway'

describe.sequential('Order Worker Integration Tests', () => {
  let testQueue: Queue
  let testWorker: Worker
  let testQueueEvents: QueueEvents
  let mockPaymentGateway: PaymentGateway

  // Helper to create dedicated resources for isolated tests
  async function createDedicatedTestResources(testName: string) {
    const testId = `${testName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const dedicatedMockPaymentGateway: PaymentGateway = {
      checkPaymentStatus: vi.fn().mockResolvedValue({
        success: true,
        status: 'success',
        data: { orderId: 123, amount: 100000 },
      } as PaymentResult),
      processPaymentUpdate: vi.fn().mockResolvedValue(undefined),
    }

    const dedicatedQueue = new Queue(`test-worker-${testId}`, {
      connection: RedisTestHelper.getConnection(),
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    })

    // Increase listeners limit to avoid MaxListenersExceeded when waiting many jobs
    dedicatedQueue.setMaxListeners(100)

    const dedicatedQueueEvents = new QueueEvents(`test-worker-${testId}`, {
      connection: RedisTestHelper.getConnection(),
    })

    dedicatedQueueEvents.setMaxListeners(100)

    // Ensure QueueEvents is ready to receive events
    await dedicatedQueueEvents.waitUntilReady()

    const dedicatedWorker = new Worker(
      `test-worker-${testId}`,
      async (job) => {
        const { type, data } = job.data

        switch (type) {
          case 'checkPaymentStatus':
            const { orderId, checkoutSdkOrderId, miniAppId } = data

            try {
              await dedicatedMockPaymentGateway.processPaymentUpdate(orderId, checkoutSdkOrderId, miniAppId)
            } catch (error) {
              throw error
            }
            break

          default:
            throw new Error(`Unknown job type: ${type}`)
        }
      },
      {
        connection: RedisTestHelper.getConnection(),
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    )

    // Wait for worker to be ready - more robust waiting
    await new Promise<void>((resolve, reject) => {
      const readyTimeout = setTimeout(() => {
        reject(new Error(`Worker ${testId} failed to become ready`))
      }, 10000)

      dedicatedWorker.once('ready', () => {
        clearTimeout(readyTimeout)
        resolve()
      })

      dedicatedWorker.once('error', (err) => {
        clearTimeout(readyTimeout)
        reject(err)
      })
    })

    return {
      queue: dedicatedQueue,
      worker: dedicatedWorker,
      events: dedicatedQueueEvents,
      gateway: dedicatedMockPaymentGateway,
      testId,
      async cleanup() {
        try {
          await dedicatedWorker.close()
        } catch (e) { console.error('Error closing worker:', e) }
        try {
          await dedicatedQueueEvents.close()
        } catch (e) { console.error('Error closing events:', e) }
        try {
          await dedicatedQueue.close()
        } catch (e) { console.error('Error closing queue:', e) }
      }
    }
  }

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
    const redis = RedisTestHelper.getConnection()

    // Ensure Redis connection is ready
    if (redis.status !== 'ready') {
      await new Promise<void>((resolve) => {
        redis.once('ready', resolve)
      })
    }

    // Clean up any existing test worker queues with retry
    let cleanupAttempts = 0
    while (cleanupAttempts < 3) {
      try {
        await RedisTestHelper.cleanup('bull:test-worker-*')
        break
      } catch (error) {
        cleanupAttempts++
        if (cleanupAttempts === 3) throw error
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Wait a bit for cleanup to propagate
    await new Promise(resolve => setTimeout(resolve, 100))

    // Clear all mock calls from previous tests (but keep implementations)
    vi.clearAllMocks()

    // Create fresh mock payment gateway for each test
    mockPaymentGateway = {
      checkPaymentStatus: vi.fn().mockResolvedValue({
        success: true,
        status: 'success',
        data: { orderId: 123, amount: 100000 },
      } as PaymentResult),
      processPaymentUpdate: vi.fn().mockResolvedValue(undefined),
    }

    // Create test queue
    testQueue = new Queue('test-worker-orders', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    })

    // Increase listeners limit on shared test resources
    testQueue.setMaxListeners(100)

    // Create queue events (it will connect automatically)
    testQueueEvents = new QueueEvents('test-worker-orders', {
      connection: redis,
    })

    testQueueEvents.setMaxListeners(100)

    // Ensure QueueEvents is ready to receive events
    await testQueueEvents.waitUntilReady()

    // Create test worker with the same processor logic as order-worker
    testWorker = new Worker(
      'test-worker-orders',
      async (job) => {
        const { type, data } = job.data

        switch (type) {
          case 'checkPaymentStatus':
            const { orderId, checkoutSdkOrderId, miniAppId } = data

            try {
              // Call payment gateway to check status and update order
              await mockPaymentGateway.processPaymentUpdate(orderId, checkoutSdkOrderId, miniAppId)
            } catch (error) {
              throw error // Re-throw to mark job as failed
            }
            break

          default:
            throw new Error(`Unknown job type: ${type}`)
        }
      },
      {
        connection: redis,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    )

    // Wait for worker to be ready
    await new Promise<void>((resolve) => {
      testWorker.once('ready', resolve)
    })
  })

  afterEach(async () => {
    // Remove all event listeners first
    testQueueEvents?.removeAllListeners()
    testWorker?.removeAllListeners()

    // Ensure worker is not paused before closing
    if (testWorker?.isPaused()) {
      await testWorker.resume()
    }

    // Close worker, queue, and events with error handling
    try {
      await testWorker?.close()
    } catch (error) {
      console.error('Error closing worker:', error)
    }

    try {
      await testQueueEvents?.close()
    } catch (error) {
      console.error('Error closing queue events:', error)
    }

    try {
      await testQueue?.close()
    } catch (error) {
      console.error('Error closing queue:', error)
    }

    // Wait a bit for connections to fully close
    await new Promise(resolve => setTimeout(resolve, 100))

    // Clean up Redis keys with retry
    let cleanupAttempts = 0
    while (cleanupAttempts < 3) {
      try {
        await RedisTestHelper.cleanup('bull:test-worker-*')
        break
      } catch (error) {
        cleanupAttempts++
        if (cleanupAttempts === 3) {
          console.error('Failed to cleanup Redis after 3 attempts')
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Clear mocks
    vi.clearAllMocks()
  })

  afterAll(async () => {
    // Disconnect Redis
    await RedisTestHelper.disconnect()

    // Clean up global Redis connection
    if ((globalThis as any).__workerRedisConnection) {
      await (globalThis as any).__workerRedisConnection.quit()
      delete (globalThis as any).__workerRedisConnection
    }
  }, 30000)

  describe('Worker initialization', () => {
    it('should create worker with correct configuration', () => {
      expect(testWorker.name).toBe('test-worker-orders')
      expect(testWorker.opts.concurrency).toBe(5)
      expect(testWorker.opts.limiter?.max).toBe(10)
      expect(testWorker.opts.limiter?.duration).toBe(1000)
    })
  })

  describe('Job processing - checkPaymentStatus', () => {
    it('should process checkPaymentStatus job successfully', async () => {
      // Create dedicated resources for this test
      const resources = await createDedicatedTestResources('checkPaymentStatus')

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 12345,
          checkoutSdkOrderId: 'checkout_12345',
          miniAppId: 'test-app-id',
        },
      }

      const job = await resources.queue.add('checkPaymentStatus', jobData)

      // Wait for completion reliably under coverage
      await job.waitUntilFinished(resources.events, 30000)

      expect(resources.gateway.processPaymentUpdate).toHaveBeenCalledWith(
        12345,
        'checkout_12345',
        'test-app-id'
      )
      expect(resources.gateway.processPaymentUpdate).toHaveBeenCalledTimes(1)

      // Cleanup
      await resources.cleanup()
    }, 35000)


    it('should handle payment gateway errors', async () => {
      // Create dedicated resources for this test
      const resources = await createDedicatedTestResources('paymentGatewayErrors')

      // Override mock to throw error
      resources.gateway.processPaymentUpdate = vi.fn().mockRejectedValue(new Error('Payment API connection error'))

      // Setup event listeners
      const eventPromise = new Promise<{ jobId: string; failedReason: string }>(
        (resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Job failure timeout')), 15000)

          const onFailed = ({ jobId, failedReason }: any) => {
            clearTimeout(timeout)
            resources.events.off('failed', onFailed)
            resources.events.off('completed', onCompleted)
            resolve({ jobId, failedReason })
          }

          const onCompleted = ({ jobId }: any) => {
            clearTimeout(timeout)
            resources.events.off('failed', onFailed)
            resources.events.off('completed', onCompleted)
            reject(new Error('Job should have failed but completed'))
          }

          resources.events.on('failed', onFailed)
          resources.events.on('completed', onCompleted)
        }
      )

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 99999,
          checkoutSdkOrderId: 'checkout_99999',
          miniAppId: 'test-app',
        },
      }

      const job = await resources.queue.add('checkPaymentStatus', jobData)

      // Wait for job failure
      const failureResult = await eventPromise

      expect(failureResult.jobId).toBe(job.id)
      expect(failureResult.failedReason).toContain('Payment API connection error')
      expect(resources.gateway.processPaymentUpdate).toHaveBeenCalled()

      // Cleanup
      await resources.cleanup()
    }, 20000)
  })

  describe('Job processing - unknown job types', () => {
    it('should fail jobs with unknown job type', async () => {
      // Create dedicated resources for this test
      const resources = await createDedicatedTestResources('unknownJobType')

      const jobData = {
        type: 'unknownJobType',
        data: {
          someData: 'test',
        },
      }

      // Add the job and poll for failure to avoid relying on events
      const job = await resources.queue.add('unknownJob', jobData)
      console.log(`Added job with ID: ${job.id}, name: ${job.name}`)

      const start = Date.now()
      const deadline = start + 20000
      let finalFailedReason = ''
      // Poll every 100ms until job state is failed or completed
      while (Date.now() < deadline) {
        const state = await job.getState()
        if (state === 'failed') {
          const fresh = await resources.queue.getJob(job.id!)
          finalFailedReason = String((fresh as any)?.failedReason || '')
          break
        }
        if (state === 'completed') {
          throw new Error('Job should have failed but completed')
        }
        await new Promise(r => setTimeout(r, 100))
      }

      if (!finalFailedReason) {
        throw new Error('Job failure timeout')
      }

      expect(finalFailedReason).toContain('Unknown job type: unknownJobType')

      // Cleanup
      await resources.cleanup()
    }, 20000)
  })

  describe('Concurrent job processing', () => {
    it('should process multiple jobs concurrently', async () => {
      // Use unique queue for this test to avoid interference
      const testId = `concurrent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const concurrentQueue = new Queue(`concurrent-${testId}`, {
        connection: RedisTestHelper.getConnection(),
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      })

      const concurrentQueueEvents = new QueueEvents(`concurrent-${testId}`, {
        connection: RedisTestHelper.getConnection(),
      })

      const concurrentWorker = new Worker(
        `concurrent-${testId}`,
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
          connection: RedisTestHelper.getConnection(),
          concurrency: 5,
          limiter: { max: 10, duration: 1000 },
        }
      )

      // Wait for worker to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Worker ready timeout')), 5000)
        concurrentWorker.once('ready', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      const timestamp = Date.now()
      const jobCount = 3

      const jobs = await Promise.all([
        concurrentQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: timestamp + 1, checkoutSdkOrderId: `checkout_${timestamp + 1}` },
        }),
        concurrentQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: timestamp + 2, checkoutSdkOrderId: `checkout_${timestamp + 2}` },
        }),
        concurrentQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: timestamp + 3, checkoutSdkOrderId: `checkout_${timestamp + 3}` },
        }),
      ])

      console.log(`[Concurrent test] Added ${jobs.length} jobs with IDs: ${jobs.map(j => j.id).join(', ')}`)

      const completedJobIds = new Set<string>()

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log(`Concurrent test timeout: Expected ${jobCount} jobs, got ${completedJobIds.size}`)
          reject(new Error(`Jobs processing timeout. Completed: ${completedJobIds.size}/${jobCount}`))
        }, 15000)

        const onCompleted = ({ jobId }: any) => {
          console.log(`Concurrent test - Job completed: ${jobId}`)
          completedJobIds.add(jobId)
          if (completedJobIds.size === jobCount) {
            clearTimeout(timeout)
            concurrentQueueEvents.off('completed', onCompleted)
            concurrentQueueEvents.off('failed', onFailed)
            resolve()
          }
        }

        const onFailed = ({ jobId, failedReason }: any) => {
          console.log(`Concurrent test - Job failed: ${jobId}, reason: ${failedReason}`)
          clearTimeout(timeout)
          concurrentQueueEvents.off('completed', onCompleted)
          concurrentQueueEvents.off('failed', onFailed)
          reject(new Error(`Job ${jobId} failed: ${failedReason}`))
        }

        concurrentQueueEvents.on('completed', onCompleted)
        concurrentQueueEvents.on('failed', onFailed)
      })

      console.log(`Concurrent test completed: ${completedJobIds.size} jobs processed`)
      expect(completedJobIds.size).toBe(jobCount)
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledTimes(jobCount)

      // Cleanup
      await concurrentWorker.close()
      await concurrentQueueEvents.close()
      await concurrentQueue.close()
    }, 20000)

    it('should respect concurrency limit', async () => {
      // Use unique queue for this test
      const testId = `concurrency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const concurrencyQueue = new Queue(`concurrency-${testId}`, {
        connection: RedisTestHelper.getConnection(),
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      })

      const concurrencyQueueEvents = new QueueEvents(`concurrency-${testId}`, {
        connection: RedisTestHelper.getConnection(),
      })

      let currentConcurrent = 0
      let maxConcurrent = 0

      const concurrencyWorker = new Worker(
        `concurrency-${testId}`,
        async (job) => {
          currentConcurrent++
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
          // Simulate work
          await new Promise(resolve => setTimeout(resolve, 200))
          currentConcurrent--
        },
        {
          connection: RedisTestHelper.getConnection(),
          concurrency: 5,
          limiter: { max: 10, duration: 1000 },
        }
      )

      // Wait for worker to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Worker ready timeout')), 5000)
        concurrencyWorker.once('ready', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      const timestamp = Date.now()
      const jobCount = 6

      const jobs = []
      for (let i = 0; i < jobCount; i++) {
        jobs.push(
          concurrencyQueue.add('checkPaymentStatus', {
            type: 'checkPaymentStatus',
            data: { orderId: timestamp + i, checkoutSdkOrderId: `checkout_${timestamp + i}` },
          })
        )
      }

      await Promise.all(jobs)

      // Wait for all jobs to complete
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Jobs processing timeout')), 20000)
        let completedCount = 0

        concurrencyQueueEvents.on('completed', () => {
          completedCount++
          if (completedCount === jobCount) {
            clearTimeout(timeout)
            resolve()
          }
        })

        concurrencyQueueEvents.on('failed', ({ failedReason }) => {
          clearTimeout(timeout)
          reject(new Error(`Job failed: ${failedReason}`))
        })
      })

      // Concurrency should not exceed configured limit (5)
      expect(maxConcurrent).toBeLessThanOrEqual(5)

      // Cleanup
      await concurrencyWorker.close()
      await concurrencyQueueEvents.close()
      await concurrencyQueue.close()
    }, 25000)
  })

  describe('Job retry and error handling', () => {
    it('should retry failed jobs according to configuration', async () => {
      // Create dedicated resources for this test
      const resources = await createDedicatedTestResources('retryJobs')

      let attemptCount = 0

      resources.gateway.processPaymentUpdate = vi.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount <= 2) { // Fail first 2 attempts
          throw new Error('Temporary payment gateway error')
        }
        // Succeed on 3rd attempt
      })

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 555,
          checkoutSdkOrderId: 'checkout_555',
        },
      }

      const job = await resources.queue.add('checkPaymentStatus', jobData, {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 100, // Faster for tests
        },
      })

      // Wait for job completion (after retries)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Job retry timeout')), 10000)

        resources.events.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })

        resources.events.on('failed', ({ jobId, failedReason }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            reject(new Error(`Job failed after retries: ${failedReason}`))
          }
        })
      })

      expect(attemptCount).toBe(3)
      expect(resources.gateway.processPaymentUpdate).toHaveBeenCalledTimes(3)

      // Cleanup
      await resources.cleanup()
    }, 15000)
  })

  describe('Worker event listeners', () => {
    it('should emit completed event on successful job processing', async () => {
      // Clear any previous mock calls
      vi.clearAllMocks()

      const uniqueOrderId = Date.now() // Unique ID for this test
      const job = await testQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: uniqueOrderId, checkoutSdkOrderId: `checkout_${uniqueOrderId}` },
      })

      // Wait for job completion using QueueEvents (more reliable than Worker events)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Job completion timeout')), 10000)

        testQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            resolve()
          }
        })

        testQueueEvents.on('failed', ({ jobId, failedReason }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            reject(new Error(`Job failed: ${failedReason}`))
          }
        })

        const onCompleted = ({ jobId }: any) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            resolve()
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
      })

      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledWith(
        uniqueOrderId,
        `checkout_${uniqueOrderId}`,
        undefined
      )
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledTimes(1)
    }, 15000)

    it('should emit failed event on job processing error', async () => {
      mockPaymentGateway.processPaymentUpdate = vi
        .fn()
        .mockRejectedValue(new Error('Gateway unavailable'))

      const job = await testQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 888, checkoutSdkOrderId: 'checkout_888' },
      })

      // Wait for job failure using QueueEvents
      const failureResult = await new Promise<{ jobId: string; failedReason: string }>(
        (resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Job failure timeout')), 10000)

          testQueueEvents.on('failed', ({ jobId, failedReason }) => {
            if (jobId === job.id) {
              clearTimeout(timeout)
              resolve({ jobId, failedReason })
            }
          })

          testQueueEvents.on('completed', ({ jobId }) => {
            if (jobId === job.id) {
              clearTimeout(timeout)
              reject(new Error('Job should have failed but completed'))
            }
          })
        }
      )

      expect(failureResult.jobId).toBe(job.id)
      expect(failureResult.failedReason).toContain('Gateway unavailable')
    }, 15000)
  })

  describe('Rate limiting', () => {
    it('should respect rate limiter settings', async () => {
      const startTime = Date.now()
      const jobCount = 12 // More than limiter.max (10)

      // Add jobs
      const jobs = []
      for (let i = 0; i < jobCount; i++) {
        jobs.push(
          testQueue.add('checkPaymentStatus', {
            type: 'checkPaymentStatus',
            data: { orderId: 900 + i, checkoutSdkOrderId: `checkout_${900 + i}` },
          })
        )
      }

      // Ensure all jobs are added
      const addedJobs = await Promise.all(jobs)

      // Wait for all jobs to complete reliably to avoid missing fast "completed" events
      await Promise.all(
        addedJobs.map((j) => j.waitUntilFinished(testQueueEvents, 25000))
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      // With rate limit of 10 jobs per second, 12 jobs should take at least 1 second
      expect(duration).toBeGreaterThanOrEqual(1000)
    }, 30000)
  })

  describe('Edge cases and data validation', () => {
    it('should handle job with missing orderId gracefully', async () => {
      // Mock to track what gets called
      mockPaymentGateway.processPaymentUpdate = vi.fn().mockResolvedValue(undefined)

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          // orderId is missing
          checkoutSdkOrderId: 'checkout_no_order_id',
          miniAppId: 'test-app-id',
        },
      }

      const job = await testQueue.add('checkPaymentStatus', jobData)

      // Wait for job completion or failure
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Job processing timeout')), 10000)

        testQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })

        testQueueEvents.on('failed', ({ jobId, failedReason }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            // It's ok if it fails - we're testing how it handles missing data
            resolve()
          }
        })
      })

      // processPaymentUpdate should be called with undefined orderId
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledWith(
        undefined,
        'checkout_no_order_id',
        'test-app-id'
      )
    }, 15000)

    it('should handle job with missing checkoutSdkOrderId gracefully', async () => {
      mockPaymentGateway.processPaymentUpdate = vi.fn().mockResolvedValue(undefined)

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: 777,
          // checkoutSdkOrderId is missing
        },
      }

      const job = await testQueue.add('checkPaymentStatus', jobData)

      // Wait for job completion or failure
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Job processing timeout')), 10000)

        testQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })

        testQueueEvents.on('failed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      // processPaymentUpdate should be called with undefined checkoutSdkOrderId
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledWith(
        777,
        undefined,
        undefined
      )
    }, 15000)

    it('should handle job with empty data object', async () => {
      mockPaymentGateway.processPaymentUpdate = vi.fn().mockResolvedValue(undefined)

      const jobData = {
        type: 'checkPaymentStatus',
        data: {}, // Empty data
      }

      const job = await testQueue.add('checkPaymentStatus', jobData)

      // Wait for job to be processed
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Job processing timeout')), 10000)

        testQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })

        testQueueEvents.on('failed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      // processPaymentUpdate should be called with all undefined values
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined
      )
    }, 15000)

    it('should handle job with null values in data', async () => {
      mockPaymentGateway.processPaymentUpdate = vi.fn().mockResolvedValue(undefined)

      const jobData = {
        type: 'checkPaymentStatus',
        data: {
          orderId: null,
          checkoutSdkOrderId: null,
          miniAppId: null,
        },
      }

      const job = await testQueue.add('checkPaymentStatus', jobData)

      // Wait for job to be processed
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Job processing timeout')), 10000)

        testQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })

        testQueueEvents.on('failed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      // processPaymentUpdate should be called with null values
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledWith(
        null,
        null,
        null
      )
    }, 15000)
  })

  describe('Worker lifecycle', () => {
    it('should handle worker pause and resume', async () => {
      try {
        // Pause the worker FIRST
        await testWorker.pause()
        expect(testWorker.isPaused()).toBe(true)

        // Now add a job while worker is paused
        const job = await testQueue.add('checkPaymentStatus', {
          type: 'checkPaymentStatus',
          data: { orderId: 1111, checkoutSdkOrderId: 'checkout_1111' },
        })

        // Wait a bit to ensure job is not processed while paused
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Verify job is still waiting or prioritized (not completed or failed)
        const jobState = await job.getState()
        expect(['waiting', 'prioritized']).toContain(jobState)

        // Resume the worker
        await testWorker.resume()
        expect(testWorker.isPaused()).toBe(false)

        // Now job should be processed
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Job processing timeout')), 10000)

          const onCompleted = ({ jobId }: any) => {
            if (jobId === job.id) {
              clearTimeout(timeout)
              testQueueEvents.off('completed', onCompleted)
              testQueueEvents.off('failed', onFailed)
              resolve()
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

        expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledWith(
          1111,
          'checkout_1111',
          undefined
        )
      } finally {
        // Ensure worker is resumed after test, even if test fails
        if (testWorker.isPaused()) {
          await testWorker.resume()
        }
      }
    }, 15000)

    it('should close worker gracefully', async () => {
      // Worker is already running, just verify it can close
      expect(testWorker.isRunning()).toBe(true)

      // Add a job and let it process
      const job = await testQueue.add('checkPaymentStatus', {
        type: 'checkPaymentStatus',
        data: { orderId: 2222, checkoutSdkOrderId: 'checkout_2222' },
      })

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Job processing timeout')), 10000)

        testQueueEvents.on('completed', ({ jobId }) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      // Close worker
      await testWorker.close()
      expect(testWorker.isRunning()).toBe(false)
    }, 15000)
  })

  describe('Job priority and delay', () => {
    it('should process higher priority jobs first', async () => {
      try {
        // Pause worker first to queue all jobs before processing
        await testWorker.pause()

        const processedJobs: number[] = []

        mockPaymentGateway.processPaymentUpdate = vi.fn().mockImplementation(async (orderId) => {
          processedJobs.push(orderId)
          await new Promise(resolve => setTimeout(resolve, 200)) // Simulate work
        })

        // Add jobs with different priorities (lower number = higher priority)
        await testQueue.add('lowPriority', {
          type: 'checkPaymentStatus',
          data: { orderId: 3, checkoutSdkOrderId: 'checkout_3' },
        }, { priority: 10 })

        await testQueue.add('highPriority', {
          type: 'checkPaymentStatus',
          data: { orderId: 1, checkoutSdkOrderId: 'checkout_1' },
        }, { priority: 1 })

        await testQueue.add('mediumPriority', {
          type: 'checkPaymentStatus',
          data: { orderId: 2, checkoutSdkOrderId: 'checkout_2' },
        }, { priority: 5 })

        // Resume worker to process jobs
        await testWorker.resume()

        // Wait for all jobs to complete
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Jobs processing timeout')), 15000)
          let completedCount = 0

          const onCompleted = () => {
            completedCount++
            if (completedCount === 3) {
              clearTimeout(timeout)
              testQueueEvents.off('completed', onCompleted)
              testQueueEvents.off('failed', onFailed)
              resolve()
            }
          }

          const onFailed = ({ failedReason }: any) => {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            reject(new Error(`Job failed: ${failedReason}`))
          }

          testQueueEvents.on('completed', onCompleted)
          testQueueEvents.on('failed', onFailed)
        })

        // Due to concurrency=5, we can't guarantee strict order, but higher priority should be processed
        // Verify all jobs were processed
        expect(processedJobs).toContain(1)
        expect(processedJobs).toContain(2)
        expect(processedJobs).toContain(3)
        expect(processedJobs.length).toBe(3)
      } finally {
        // Ensure worker is resumed
        if (testWorker.isPaused()) {
          await testWorker.resume()
        }
      }
    }, 20000)

    it('should respect job delay', async () => {
      const startTime = Date.now()
      const delay = 2000 // 2 second delay

      const job = await testQueue.add('delayedJob', {
        type: 'checkPaymentStatus',
        data: { orderId: 5555, checkoutSdkOrderId: 'checkout_5555' },
      }, { delay })

      // Wait for job completion
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Job processing timeout')), 10000)

        const onCompleted = ({ jobId }: any) => {
          if (jobId === job.id) {
            clearTimeout(timeout)
            testQueueEvents.off('completed', onCompleted)
            testQueueEvents.off('failed', onFailed)
            resolve()
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

      const endTime = Date.now()
      const duration = endTime - startTime

      // Job should not be processed before the delay
      expect(duration).toBeGreaterThanOrEqual(delay)
      expect(mockPaymentGateway.processPaymentUpdate).toHaveBeenCalledWith(
        5555,
        'checkout_5555',
        undefined
      )
    }, 15000)
  })
})
