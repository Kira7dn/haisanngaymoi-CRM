'use client'

import PostHeader from './PostHeader'
import PostScheduler from './PostScheduler'
import PostFilter from './PostFilter'
import { usePostStore } from '../_store/usePostStore'
import { useEffect } from 'react'

export default function PostsPageClient() {
  const { loadPosts } = usePostStore()

  useEffect(() => {
    // Bắt đầu tính thời gian
    const startTime = performance.now()
    console.log('[PostsPageClient] Starting to load posts at:', startTime)

    loadPosts().then(() => {
      // Tính toán thời gian khi load xong
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Lấy server process time từ store
      const { serverProcessTime } = usePostStore.getState()

      console.log(`[PostsPageClient] Total load time: ${totalTime.toFixed(2)}ms`)
      if (serverProcessTime) {
        const networkTime = totalTime - serverProcessTime
        console.log(`[PostsPageClient] Server process time: ${serverProcessTime.toFixed(2)}ms`)
        console.log(`[PostsPageClient] Network + client processing time: ${networkTime.toFixed(2)}ms`)
      }
      console.log(`[PostsPageClient] Total time = client processing + network + server processing`)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <PostHeader />
      <div className="flex flex-col items-center justify-between gap-2">
        <div className="space-y-4 w-full">

          <PostScheduler />
        </div>
      </div>
    </div>
  )
}
