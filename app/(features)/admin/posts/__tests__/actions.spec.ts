import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockExecute = vi.fn()

vi.mock('../../../api/posts/depends', () => ({
  createPostUseCase: vi.fn().mockResolvedValue({ execute: mockExecute.mockResolvedValue({ post: { id: '123', title: 'mock', body: 'mock' } }) }),
  deletePostUseCase: vi.fn().mockResolvedValue({ execute: mockExecute.mockResolvedValue({ success: true }) }),
  updatePostUseCase: vi.fn().mockResolvedValue({ execute: mockExecute.mockResolvedValue({ post: { id: '1', title: 'T2', body: 'B2' } }) }),
  getPostsUseCase: vi.fn().mockResolvedValue({ execute: mockExecute.mockResolvedValue({ posts: [] }) }),
}))

vi.mock('next/cache', async () => {
  return {
    revalidatePath: vi.fn(),
  }
})

describe('Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecute.mockClear()
  })

  it('createPostAction passes formData to use case', async () => {
    const { createPostAction } = await import('../actions')
    const fd = new FormData()
    fd.append('title', 'T')
    fd.append('body', 'B')

    await createPostAction(fd)

    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({ title: 'T', body: 'B' }))
  })

  it('deletePostAction calls delete use case', async () => {
    const { deletePostAction } = await import('../actions')
    await deletePostAction('1')
    expect(mockExecute).toHaveBeenCalledWith({ id: '1' })
  })

  it('updatePostAction calls update use case with formData', async () => {
    const { updatePostAction } = await import('../actions')
    const fd = new FormData()
    fd.append('title', 'T2')
    fd.append('body', 'B2')
    await updatePostAction('1', fd)
    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({ id: '1', title: 'T2', body: 'B2' }))
  })
})
