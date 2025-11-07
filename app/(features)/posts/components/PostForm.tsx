'use client'

import { useTransition } from 'react'
import { createPostAction } from '../actions'

export default function PostForm() {
  const [pending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createPostAction(formData)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-2 mt-2">
      <input name="title" placeholder="Title" className="border p-2 w-full rounded" required />
      <textarea name="body" placeholder="Body" className="border p-2 w-full rounded" required />
      <button type="submit" disabled={pending} className="bg-blue-500 text-white px-3 py-1 rounded">
        {pending ? 'Saving...' : 'Add Post'}
      </button>
    </form>
  )
}
