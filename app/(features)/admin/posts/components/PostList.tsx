'use client'

import { useEffect, useTransition } from 'react'
import type { Post } from '@/core/domain/post'
import { usePostStore } from '../store/usePostStore'
import { deletePostAction } from '../actions'

export default function PostList({ initialPosts }: { initialPosts: Post[] }) {
  const { posts, setPosts, filter } = usePostStore()
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts, setPosts])

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <ul className="mt-4 space-y-1">
      {filtered.map((p) => (
        <li key={p.id} className="flex items-center justify-between border-b py-2">
          <div>{p.title}</div>
          <button
            onClick={() => startTransition(async () => { await deletePostAction(p.id) })}
            disabled={pending}
            className="text-red-500"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}
