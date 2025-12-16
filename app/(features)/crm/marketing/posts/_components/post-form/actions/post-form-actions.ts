import { Post, PostStatus } from '@/core/domain/marketing/post'
import { PostFormState } from '../state/usePostFormState'
import { updatePostAction } from '../../../_actions/update-post-action'
import { createPostAction } from '../../../_actions/create-post-action'
import { deletePostAction } from '../../../_actions/delete-post-action'

// ---------- helpers ----------

const parseHashtags = (value: string): string[] =>
  value
    .split(/\s+/)
    .filter(tag => tag.startsWith('#'))
    .map(tag => tag.slice(1))

// ---------- types ----------
// PostFormActions.ts
export interface PostFormActions {
  submit: () => Promise<void>
  saveDraft: () => Promise<void>
  delete: () => Promise<void>
}

export type SubmitMode = 'draft' | 'schedule' | 'publish'

export interface PostFormActionsDeps {
  getState: () => PostFormState
  post?: Post
}

// ---------- factory ----------

/**
 * createPostFormActions
 *
 * Plain action factory (NO React, NO hook)
 */
export function PostFormActions({
  getState,
  post,
}: PostFormActionsDeps): PostFormActions {

  // ===== submit (publish / schedule) =====

  const submit = async (): Promise<void> => {
    const state = getState()

    if (state.platforms.length === 0) {
      throw new Error('Please select at least one platform')
    }

    const payload = {
      title: state.title,
      body: state.body,
      contentType: state.contentType,
      platforms: state.platforms.map(platform => ({
        platform: platform.platform,
        status: (state.scheduledAt ? "scheduled" : "draft") as PostStatus
      })),
      media: state.media || undefined,
      hashtags: parseHashtags(state.hashtags),
      scheduledAt: state.scheduledAt ? new Date(state.scheduledAt) : undefined,
    }

    // update
    if (post?.id) {
      const updatePayload = {
        title: state.title,
        body: state.body,
        contentType: state.contentType,
        platforms: state.platforms.map(platform => ({
          platform: platform.platform,
          status: (state.scheduledAt ? "scheduled" : "draft") as PostStatus
        })),
        media: state.media || undefined,
        hashtags: parseHashtags(state.hashtags),
        scheduledAt: state.scheduledAt ? new Date(state.scheduledAt) : undefined,
      }
      await updatePostAction({
        postId: post.id,
        payload: updatePayload,
      })
      return
    }

    // create
    await createPostAction({
      payload,
    })
  }

  // ===== save draft =====

  const saveDraft = async (): Promise<void> => {
    const state = getState()

    const payload = {
      title: state.title,
      body: state.body,
      contentType: state.contentType,
      platforms: state.platforms.map(platform => ({
        platform: platform.platform,
        status: "draft" as PostStatus
      })),
      media: state.media || undefined,
      hashtags: parseHashtags(state.hashtags),
      scheduledAt: undefined,
    }

    if (post?.id) {
      const updatePayload = {
        title: state.title,
        body: state.body,
        contentType: state.contentType,
        platforms: state.platforms.map(platform => ({
          platform: platform.platform,
          status: "draft" as PostStatus
        })),
        media: state.media || undefined,
        hashtags: parseHashtags(state.hashtags),
        scheduledAt: undefined,
      }
      await updatePostAction({
        postId: post.id,
        payload: updatePayload,
      })
      return
    }

    await createPostAction({
      payload,
    })
  }

  // ===== delete =====

  const deletePost = async (): Promise<void> => {
    if (!post?.id) {
      throw new Error('No post to delete')
    }

    await deletePostAction(post.id)
  }

  return {
    submit,
    saveDraft,
    delete: deletePost,
  }
}
