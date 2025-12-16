import { Product } from '@/core/domain/catalog/product'
import { ContentType, PlatformMetadata, Post, PostMedia } from '@/core/domain/marketing/post'
import { useRef, useState, useCallback, useEffect } from 'react'


// ---------- types ----------
export interface PostFormState {
    // ===== form fields =====
    title: string
    body: string
    media: PostMedia | null
    hashtags: string
    platforms: PlatformMetadata[]
    contentType: ContentType
    scheduledAt?: Date

    // ===== AI / helper =====
    idea: string
    product: Product | null
    contentInstruction: string
    // Generation state
    variations: Array<{ title: string; content: string; style: string }>
}

function mapPostToFormState(
    post: Post,
    initialIdea?: string,
    initialScheduledAt?: Date
): PostFormState {
    return {
        title: post.title ?? '',
        body: post.body ?? '',
        media: post.media ?? null,
        hashtags: post.hashtags?.join(' ') ?? '',
        platforms: post.platforms,
        contentType: post.contentType ?? 'post',
        scheduledAt: post.scheduledAt
            ? new Date(post.scheduledAt)
            : initialScheduledAt,

        idea: initialIdea ?? '',
        product: null,
        contentInstruction: '',
        variations: [],
    }
}

function createEmptyState(
    initialIdea?: string,
    initialScheduledAt?: Date
): PostFormState {
    return {
        title: '',
        body: '',
        media: null,
        hashtags: '',
        platforms: [],
        contentType: 'post',
        scheduledAt: initialScheduledAt,
        idea: initialIdea ?? '',
        product: null,
        contentInstruction: '',
        variations: [],
    }
}

// ---------- hook (React adapter) ----------

export function usePostFormState({
    post,
    initialIdea,
    initialScheduledAt,
}: {
    post?: Post
    initialIdea?: string
    initialScheduledAt?: Date
}) {
    // snapshot ban đầu
    const initialStateRef = useRef<PostFormState>(
        post
            ? mapPostToFormState(post, initialIdea, initialScheduledAt)
            : createEmptyState(initialIdea, initialScheduledAt)
    )

    const isDirtyRef = useRef(false)

    const [state, setState] = useState<PostFormState>(
        initialStateRef.current
    )

    // reset khi đổi post (edit post khác / click calendar)
    useEffect(() => {
        initialStateRef.current = post
            ? mapPostToFormState(post, initialIdea, initialScheduledAt)
            : createEmptyState(initialIdea, initialScheduledAt)

        isDirtyRef.current = false
        setState(initialStateRef.current)
    }, [post?.id, initialIdea, initialScheduledAt])

    // ---------- setters ----------

    const setField = useCallback(
        <K extends keyof PostFormState>(key: K, value: PostFormState[K]) => {
            isDirtyRef.current = true
            setState(prev => ({ ...prev, [key]: value }))
        },
        []
    )

    const updateMultipleFields = useCallback(
        (updates: Partial<PostFormState>) => {
            isDirtyRef.current = true
            setState(prev => ({ ...prev, ...updates }))
        },
        []
    )


    return {
        state,
        setField,
        updateMultipleFields,
        isDirty: isDirtyRef.current,
    }
}
