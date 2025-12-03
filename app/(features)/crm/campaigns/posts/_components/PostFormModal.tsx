'use client'

import PostForm from './PostForm'
import type { Post } from '@/core/domain/marketing/post'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@shared/ui/dialog'

interface PostFormModalProps {
  open: boolean
  onClose: () => void
  post?: Post
  initialScheduledAt?: Date
}

export default function PostFormModal({ open, onClose, post, initialScheduledAt }: PostFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-semibold mb-4">
          {post ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng mới'}
        </DialogTitle>
        <PostForm
          post={post}
          onClose={onClose}
          initialScheduledAt={initialScheduledAt}
        />
      </DialogContent>
    </Dialog>
  )
}
