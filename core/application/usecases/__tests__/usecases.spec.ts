import { describe, it, expect, vi } from 'vitest'
import { createPostUseCase } from '@/core/application/usecases/marketing/post/post/create-post'
import { postRepository } from '@/infrastructure/repositories/marketing/post-repo'

vi.mock('@/infrastructure/repositories/marketing/post-repo', () => ({
  postRepository: {
    create: vi.fn().mockResolvedValue({ id: '1', title: 'T', body: 'B' }),
  },
}))

describe('UseCase: createPost', () => {
  it('should create post using repository', async () => {
    const result = await createPostUseCase({ title: 'T', body: 'B' })
    expect(result).toEqual({ id: '1', title: 'T', body: 'B' })
    expect(postRepository.create).toHaveBeenCalledOnce()
  })
})
