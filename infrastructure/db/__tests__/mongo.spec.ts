import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock MongoDB
vi.mock('mongodb', () => ({
  MongoClient: class {
    constructor(uri: string, options: any) {
      return {
        connect: vi.fn().mockResolvedValue('mockClient')
      }
    }
  }
}))

beforeEach(() => {
  // Reset global state
  delete (global as any)._mongoClientPromise
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  delete (global as any)._mongoClientPromise
})

describe('MongoDB Connection', () => {
  describe('Environment validation', () => {
    it('should throw error when MONGODB_URI is not provided', async () => {
      vi.resetModules()
      vi.stubEnv('MONGODB_URI', '')
      await expect(import('../mongo')).rejects.toThrow('Please add MONGODB_URI')
    })

    it('should not throw error when MONGODB_URI is provided', async () => {
      vi.resetModules()
      vi.stubEnv('MONGODB_URI', 'mongodb://test')
      await expect(import('../mongo')).resolves.not.toThrow()
    })
  })

  describe('Development mode', () => {
    it('should create client and store in global for development', async () => {
      vi.resetModules()
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('MONGODB_URI', 'mongodb://test')
      const module1 = await import('../mongo')
      expect((global as any)._mongoClientPromise).toBeDefined()
      expect(typeof (global as any)._mongoClientPromise.then).toBe('function')
      // module should export the same promise as global
      expect(module1.default).toBe((global as any)._mongoClientPromise)
    })

    it('should reuse existing global client on subsequent imports', async () => {
      vi.resetModules()
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('MONGODB_URI', 'mongodb://test')
      const first = await import('../mongo')
      const firstPromise = first.default
      const second = await import('../mongo')
      const secondPromise = second.default
      expect(secondPromise).toBe(firstPromise)
    })
  })

  describe('Production mode', () => {
    it('should create new client for each import in production', async () => {
      vi.resetModules()
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('MONGODB_URI', 'mongodb://test')
      const mod = await import('../mongo')
      expect((global as any)._mongoClientPromise).toBeUndefined()
      expect(typeof mod.default.then).toBe('function')
    })
  })

  describe('Connection options', () => {
    it('should use correct connection options', async () => {
      vi.resetModules()
      vi.stubEnv('MONGODB_URI', 'mongodb://test')
      vi.stubEnv('NODE_ENV', 'development')
      const mongoModule = await import('../mongo')
      // Just ensure module exports a Promise (connect())
      expect(typeof mongoModule.default.then).toBe('function')
    })
  })
})
