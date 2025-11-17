import { PostRepository } from '@/infrastructure/repositories/post-repo';
import type { PostService } from '@/core/application/interfaces/post-service';
import { GetPostsUseCase } from '@/core/application/usecases/post/get-posts';
import { CreatePostUseCase } from '@/core/application/usecases/post/create-post';
import { UpdatePostUseCase } from '@/core/application/usecases/post/update-post';
import { DeletePostUseCase } from '@/core/application/usecases/post/delete-post';

// Create PostRepository instance
const createPostRepository = async (): Promise<PostService> => {
  return new PostRepository();
};

// Create use case instances
export const getPostsUseCase = async () => {
  const postService = await createPostRepository();
  return new GetPostsUseCase(postService);
};

export const createPostUseCase = async () => {
  const postService = await createPostRepository();
  return new CreatePostUseCase(postService);
};

export const updatePostUseCase = async () => {
  const postService = await createPostRepository();
  return new UpdatePostUseCase(postService);
};

export const deletePostUseCase = async () => {
  const postService = await createPostRepository();
  return new DeletePostUseCase(postService);
};
