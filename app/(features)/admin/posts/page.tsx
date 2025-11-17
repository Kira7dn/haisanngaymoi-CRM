import { getPostsUseCase } from '@/app/api/posts/depends'
import PostList from './components/PostList'
import PostFilter from './components/PostFilter'
import PostForm from './components/PostForm'

export default async function PostsPage() {
  const useCase = await getPostsUseCase()
  const result = await useCase.execute()
  const plainPosts = JSON.parse(JSON.stringify(result.posts))
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">All Posts</h1>
      <PostForm />
      <PostFilter />
      <PostList initialPosts={plainPosts} />
    </div>
  )
}
