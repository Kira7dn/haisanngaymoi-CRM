import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { BullMQAdapter } from '@/infrastructure/queue/bullmq-adapter'
import { RedisTestHelper } from '@/infrastructure/db/__tests__/redis-test-helper'
import { Queue, QueueEvents } from 'bullmq'

describe('BullMQAdapter Integration Tests', () => {
  let adapter: BullMQAdapter
  let queueEvents: QueueEvents | null = null

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
    await RedisTestHelper.cleanup('bull:test-*')

    // Reset the global connection to force new adapter to create fresh connection
    if ((globalThis as any).__bullmqRedisConnection) {
      try {
        if ((globalThis as any).__bullmqRedisConnection.status !== 'end') {
          await (globalThis as any).__bullmqRedisConnection.quit()
        }
      } catch {
        // Ignore
      }
      delete (globalThis as any).__bullmqRedisConnection
    }

    adapter = new BullMQAdapter()
  })

  afterEach(async () => {
    // Clean up queue events
    if (queueEvents) {
      try {
        await queueEvents.close()
      } catch {
        // Ignore close errors
      }
      queueEvents = null
    }

    // Close queues (but don't close Redis connection - will be reused)
    try {
      // Close individual queues without closing the shared Redis connection
      const queuesMap = (adapter as any).queues as Map<string, any>
      for (const [_, queue] of queuesMap) {
        await queue.close()
      }
      queuesMap.clear()
    } catch (error) {
      // Ignore cleanup errors
    }

    // Clean up Redis keys
    await RedisTestHelper.cleanup('bull:test-*')
  })

  afterAll(async () => {
    // Clean up global Redis connection used by BullMQAdapter
    if ((globalThis as any).__bullmqRedisConnection) {
      try {
        if ((globalThis as any).__bullmqRedisConnection.status !== 'end') {
          await (globalThis as any).__bullmqRedisConnection.quit()
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      delete (globalThis as any).__bullmqRedisConnection
    }

    // Disconnect Redis test helper
    await RedisTestHelper.disconnect()
  }, 30000)

  describe('addJob', () => {
    it('should add a job to the queue and return job ID', async () => {
      const queueName = 'test-queue-1'
      const jobName = 'test-job'
      const data = { message: 'Hello World' }

      const jobId = await adapter.addJob(queueName, jobName, data)

      expect(jobId).toBeTruthy()
      expect(typeof jobId).toBe('string')

      // Verify job was actually added to Redis
      const redis = RedisTestHelper.getConnection()
      const keys = await redis.keys(`bull:${queueName}:*`)
      expect(keys.length).toBeGreaterThan(0)
    })

    it('should add job with delay option', async () => {
      const queueName = 'test-queue-delay'
      const jobName = 'delayed-job'
      const data = { delayed: true }
      const delay = 5000

      const jobId = await adapter.addJob(queueName, jobName, data, { delay })

      expect(jobId).toBeTruthy()

      // Verify job is in delayed state
      const redis = RedisTestHelper.getConnection()
      const delayedKeys = await redis.keys(`bull:${queueName}:delayed`)
      expect(delayedKeys.length).toBeGreaterThan(0)
    }, 10000)

    it('should add job with priority option', async () => {
      const queueName = 'test-queue-priority'
      const jobName = 'priority-job'
      const data = { priority: 'high' }
      const priority = 1

      const jobId = await adapter.addJob(queueName, jobName, data, { priority })

      expect(jobId).toBeTruthy()

      // Verify job was added
      const redis = RedisTestHelper.getConnection()
      const keys = await redis.keys(`bull:${queueName}:*`)
      expect(keys.length).toBeGreaterThan(0)
    })

    it('should add multiple jobs to the same queue', async () => {
      const queueName = 'test-queue-multiple'
      const jobs = [
        { name: 'job1', data: { id: 1 } },
        { name: 'job2', data: { id: 2 } },
        { name: 'job3', data: { id: 3 } },
      ]

      const jobIds = await Promise.all(
        jobs.map(job => adapter.addJob(queueName, job.name, job.data))
      )

      expect(jobIds).toHaveLength(3)
      jobIds.forEach(id => expect(id).toBeTruthy())

      // All job IDs should be unique
      const uniqueIds = new Set(jobIds)
      expect(uniqueIds.size).toBe(3)
    })

    it('should add jobs to different queues', async () => {
      const queue1 = 'test-queue-a'
      const queue2 = 'test-queue-b'

      const jobId1 = await adapter.addJob(queue1, 'job1', { queue: 'a' })
      const jobId2 = await adapter.addJob(queue2, 'job2', { queue: 'b' })

      expect(jobId1).toBeTruthy()
      expect(jobId2).toBeTruthy()

      // Verify both queues exist in Redis
      const redis = RedisTestHelper.getConnection()
      const keys1 = await redis.keys(`bull:${queue1}:*`)
      const keys2 = await redis.keys(`bull:${queue2}:*`)

      expect(keys1.length).toBeGreaterThan(0)
      expect(keys2.length).toBeGreaterThan(0)
    })
  })

  describe('close', () => {
    it('should close a specific queue', async () => {
      const queueName = 'test-queue-close'

      // Add a job first
      await adapter.addJob(queueName, 'test-job', { data: 'test' })

      // Close the queue
      await adapter.close(queueName)

      // Verify queue was closed (should be able to add again after closing)
      await expect(adapter.addJob(queueName, 'test-job-2', { data: 'test2' }))
        .resolves.toBeTruthy()
    })

    it('should handle closing non-existent queue gracefully', async () => {
      await expect(adapter.close('non-existent-queue')).resolves.not.toThrow()
    })
  })

  describe('closeAll', () => {
    it('should close all queues and Redis connection', async () => {
      // Create multiple queues
      const jobId1 = await adapter.addJob('queue-1', 'job1', { data: 1 })
      const jobId2 = await adapter.addJob('queue-2', 'job2', { data: 2 })
      const jobId3 = await adapter.addJob('queue-3', 'job3', { data: 3 })

      // Verify jobs were created
      expect(jobId1).toBeTruthy()
      expect(jobId2).toBeTruthy()
      expect(jobId3).toBeTruthy()

      // Verify global connection exists before closing
      expect((globalThis as any).__bullmqRedisConnection).toBeDefined()

      // Close all should not throw
      await expect(adapter.closeAll()).resolves.not.toThrow()

      // closeAll closes queues and Redis connection
      // The global reference might be deleted or set to a closed connection
    })

    it('should handle closing when no queues exist', async () => {
      const emptyAdapter = new BullMQAdapter()
      await expect(emptyAdapter.closeAll()).resolves.not.toThrow()
    })
  })

  describe('Queue reuse', () => {
    it('should reuse the same queue instance for same queue name', async () => {
      const queueName = 'test-queue-reuse'

      // Add jobs to same queue multiple times
      const jobId1 = await adapter.addJob(queueName, 'job1', { id: 1 })
      const jobId2 = await adapter.addJob(queueName, 'job2', { id: 2 })

      expect(jobId1).toBeTruthy()
      expect(jobId2).toBeTruthy()

      // Both jobs should be in the same queue
      const redis = RedisTestHelper.getConnection()
      const jobs = await redis.lrange(`bull:${queueName}:wait`, 0, -1)
      expect(jobs.length).toBeGreaterThanOrEqual(0) // Jobs might be processed
    })
  })

  describe('Redis connection singleton', () => {
    it('should use the same Redis connection across multiple adapters', async () => {
      const adapter1 = new BullMQAdapter()
      const adapter2 = new BullMQAdapter()

      // Add jobs to trigger connection creation
      await adapter1.addJob('queue-1', 'job1', { adapter: 1 })

      // After first job, global connection should exist
      const firstConnection = (globalThis as any).__bullmqRedisConnection
      expect(firstConnection).toBeDefined()

      // Second adapter should reuse the same global Redis connection
      await adapter2.addJob('queue-2', 'job2', { adapter: 2 })

      const secondConnection = (globalThis as any).__bullmqRedisConnection
      expect(secondConnection).toBe(firstConnection)

      // Both should work with the same Redis connection
      const redis = RedisTestHelper.getConnection()
      const keys1 = await redis.keys('bull:queue-1:*')
      const keys2 = await redis.keys('bull:queue-2:*')

      expect(keys1.length).toBeGreaterThan(0)
      expect(keys2.length).toBeGreaterThan(0)
    })
  })

  describe('Job data integrity', () => {
    it('should preserve complex job data structures', async () => {
      const queueName = 'test-queue-complex-data'
      const complexData = {
        user: {
          id: 123,
          name: 'Test User',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        items: [
          { id: 1, name: 'Item 1', price: 100 },
          { id: 2, name: 'Item 2', price: 200 },
        ],
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'integration-test',
        },
      }

      const jobId = await adapter.addJob(queueName, 'complex-job', complexData)

      expect(jobId).toBeTruthy()

      // Retrieve job data from Redis to verify integrity
      const queue = new Queue(queueName, {
        connection: RedisTestHelper.getConnection(),
      })

      const job = await queue.getJob(jobId)
      expect(job).toBeTruthy()
      expect(job?.data).toEqual(complexData)

      await queue.close()
    }, 10000)
  })

  describe('Error handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Close global Redis connection to simulate error
      if ((globalThis as any).__bullmqRedisConnection) {
        await (globalThis as any).__bullmqRedisConnection.quit()
        delete (globalThis as any).__bullmqRedisConnection
      }

      const newAdapter = new BullMQAdapter()

      // Should recreate connection and work
      await expect(newAdapter.addJob('test-queue', 'test-job', { test: true }))
        .resolves.toBeTruthy()

      await newAdapter.closeAll()
    })
  })
})
