import { getPostsUseCase } from '@/core/application/usecases/get-posts'
import PostList from './components/PostList'
import PostFilter from './components/PostFilter'
import PostForm from './components/PostForm'

export default async function PostsPage() {
  const posts = await getPostsUseCase()
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">All Posts</h1>
      <PostForm />
      <PostFilter />
      <PostList initialPosts={posts} />
    </div>
  )
}
