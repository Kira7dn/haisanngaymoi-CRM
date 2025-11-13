import { describe, beforeAll, afterAll, it, expect } from 'vitest'
import { MongoClient } from 'mongodb'

let uri: string
let client: MongoClient
const TEST_PREFIX = `vitest_${process.pid}_`

describe.sequential('postRepository (integration)', () => {
  beforeAll(async () => {
    if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
      throw new Error('MONGODB_URI and MONGODB_DB must be set to run integration tests against Mongo Cloud')
    }
    uri = process.env.MONGODB_URI
    client = new MongoClient(uri)
    await client.connect()
  }, 60000)

  afterAll(async () => {
    if (client) {
      await client.close()
    }
    // no in-memory server to stop
  })

  it('should insert and fetch posts', async () => {
    const { postRepository } = await import('@/infrastructure/repositories/post-repo')
    const created = await postRepository.create({ title: TEST_PREFIX + 'Test', body: '123' })
    expect(created.id).toBeDefined()

    const all = await postRepository.getAll()
    const found = all.find(p => p.id === created.id)
    expect(found).toBeDefined()
    expect(found?.title).toBe(TEST_PREFIX + 'Test')
  })

  it('should return null for updating non-existent post', async () => {
    const { postRepository } = await import('@/infrastructure/repositories/post-repo')

    // Try to update a post with invalid ObjectId
    const result = await postRepository.update('507f1f77bcf86cd799439011', { title: 'New Title' })
    expect(result).toBe(false)
  })

  it('should return false for deleting non-existent post', async () => {
    const { postRepository } = await import('@/infrastructure/repositories/post-repo')

    // Try to delete a post with invalid ObjectId
    const result = await postRepository.delete('507f1f77bcf86cd799439011')
    expect(result).toBe(false)
  })

  it('should handle null/undefined title gracefully', async () => {
    const { postRepository } = await import('@/infrastructure/repositories/post-repo')

    // Insert post with null title
    const created = await postRepository.create({ title: null as any, body: 'content' })
    expect(created.title).toBe(null) // create returns input value

    const posts = await postRepository.getAll()
    const found = posts.find(p => p.id === created.id)
    expect(found?.title).toBe('Untitled') // getAll converts null to "Untitled"
  })

  it('should handle null body correctly', async () => {
    const { postRepository } = await import('@/infrastructure/repositories/post-repo')

    // Insert post with null body
    const created = await postRepository.create({ title: 'Test', body: null as any })
    expect(created.body).toBe(null) // create returns input value

    const posts = await postRepository.getAll()
    const found = posts.find(p => p.id === created.id)
    expect(found?.body).toBeUndefined() // getAll converts null to undefined
  })

  it('should update only provided fields', async () => {
    const { postRepository } = await import('@/infrastructure/repositories/post-repo')

    // Create post
    const created = await postRepository.create({ title: 'Original', body: 'Original body' })

    // Update only title
    const updated = await postRepository.update(created.id, { title: 'Updated Title' })
    expect(updated).toBe(true)

    const posts = await postRepository.getAll()
    const found = posts.find(p => p.id === created.id)
    expect(found?.title).toBe('Updated Title')
    expect(found?.body).toBe('Original body') // Should remain unchanged
  })
})
