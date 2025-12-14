import { ContentType, Platform, Post, PostMedia } from "@/core/domain/marketing/post"
import { useRef, useState } from "react"
import { formatDateForInput } from "@/lib/date-utils"
import { Product } from "@/core/domain/catalog/product"

export interface PostFormState {
    title: string
    body: string
    media: PostMedia | null
    hashtags: string

    platforms: Platform[]
    contentType: ContentType
    scheduledAt?: string

    idea: string
    product: Product | null
    contentInstruction: string

    // Generation state
    variations: Array<{ title: string; content: string; style: string }>

    // Quality & similarity
    scoringData: {
        score?: number
        scoreBreakdown?: Record<string, number>
        weaknesses?: string[]
        suggestedFixes?: string[]
    } | null
    similarityWarning: string | null
    generationProgress: string[]

    // UI state
    showSettings: boolean
    generationMode: 'simple' | 'multi-pass'

    // System flags
    hasBrandMemory: boolean
    products: Product[]
}

// Helper: Map Post entity to form state
function mapPostToFormState(post: Post): PostFormState {
    return {
        title: post.title || '',
        body: post.body || '',
        media: post.media || null,
        hashtags: post.hashtags?.join(' ') || '',
        platforms: post.platforms.map(p => p.platform) || [],
        contentType: post.contentType || 'post',
        scheduledAt: post.scheduledAt ? formatDateForInput(new Date(post.scheduledAt)) : undefined,
        idea: '',
        product: null,
        contentInstruction: '',
        variations: [],
        scoringData: null,
        similarityWarning: null,
        generationProgress: [],
        showSettings: false,
        generationMode: 'multi-pass',
        hasBrandMemory: false,
        products: []
    }
}

// Helper: Create empty state
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
        scheduledAt: initialScheduledAt ? formatDateForInput(initialScheduledAt) : undefined,
        idea: initialIdea || '',
        product: null,
        contentInstruction: '',
        variations: [],
        scoringData: null,
        similarityWarning: null,
        generationProgress: [],
        showSettings: false,
        generationMode: 'multi-pass',
        hasBrandMemory: false,
        products: []
    }
}

// Helper: Deep equality check
function deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b)
}

export function usePostFormState({
    post,
    initialIdea,
    initialScheduledAt
}: {
    post?: Post
    initialIdea?: string
    initialScheduledAt?: Date
}) {
    const initialState = useRef<PostFormState>(
        post
            ? mapPostToFormState(post)
            : createEmptyState(initialIdea, initialScheduledAt)
    )

    const [state, setState] = useState<PostFormState>(
        initialState.current
    )

    // ---------- setters ----------
    const setField = <K extends keyof PostFormState>(
        key: K,
        value: PostFormState[K]
    ) => {
        setState(prev => ({ ...prev, [key]: value }))
    }

    const updateMultipleFields = (updates: Partial<PostFormState>) => {
        setState(prev => ({ ...prev, ...updates }))
    }

    // ---------- derived ----------
    const primaryPlatform = state.platforms.at(0)
    const hasTextContent = Boolean(
        state.title.trim() || state.body.trim()
    )
    const isVideoContent = ['video', 'reel', 'short'].includes(state.contentType)

    const isDirty = !deepEqual(state, initialState.current)

    return {
        state,
        setField,
        updateMultipleFields,

        // derived
        primaryPlatform,
        hasTextContent,
        isVideoContent,
        isDirty
    }
}
