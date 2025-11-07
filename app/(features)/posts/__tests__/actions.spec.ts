import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/core/application/usecases/create-post', () => ({
  createPostUseCase: vi.fn().mockResolvedValue({ id: '123', title: 'mock', body: 'mock' }),
}))
vi.mock('@/core/application/usecases/delete-post', () => ({
  deletePostUseCase: vi.fn().mockResolvedValue(true),
}))
vi.mock('@/core/application/usecases/update-post', () => ({
  updatePostUseCase: vi.fn().mockResolvedValue(true),
}))

vi.mock('next/cache', async () => {
  return {
    revalidatePath: vi.fn(),
  }
})

describe('Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createPostAction passes formData to use case', async () => {
    const { createPostAction } = await import('../actions')
    const fd = new FormData()
    fd.append('title', 'T')
    fd.append('body', 'B')

    await createPostAction(fd)

    const { createPostUseCase } = await import('@/core/application/usecases/create-post')
    expect(createPostUseCase).toHaveBeenCalledWith({ title: 'T', body: 'B' })
  })

  it('deletePostAction calls delete use case', async () => {
    const { deletePostAction } = await import('../actions')
    await deletePostAction('1')
    const { deletePostUseCase } = await import('@/core/application/usecases/delete-post')
    expect(deletePostUseCase).toHaveBeenCalledWith('1')
  })

  it('updatePostAction calls update use case with formData', async () => {
    const { updatePostAction } = await import('../actions')
    const fd = new FormData()
    fd.append('title', 'T2')
    fd.append('body', 'B2')
    await updatePostAction('1', fd)
    const { updatePostUseCase } = await import('@/core/application/usecases/update-post')
    expect(updatePostUseCase).toHaveBeenCalledWith('1', { title: 'T2', body: 'B2' })
  })
})
