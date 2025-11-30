import { describe, it, expect } from 'vitest'
import type { Post } from '@/core/domain/post'

describe('Post Domain', () => {
  it('should define a valid post shape', () => {
    const post: Post = { id: '1', title: 'Hello', body: 'World' }
    expect(post.title).toBe('Hello')
    expect(post.body).toBe('World')
  })
})
