
/**
 * LLM Request configuration
 */
export interface LLMRequest {
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
}

/**
 * LLM Response
 */
export interface LLMResponse {
    content: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
    model: string;
}

export interface ILLMService {
    generateCompletion(request: LLMRequest): Promise<LLMResponse>;
    generateStreamingCompletion(request: LLMRequest): AsyncGenerator<string, void, unknown>;
}


/**
 * Generation Session stored in cache
 */
export interface GenerationSession {
    sessionId: string
    researchPass?: {
        insights: string[]
        risks: string[]
        recommendedAngles: string[]
        sources: Array<{ url: string; title: string }>
    }
    ragPass?: {
        product: any
        ragContext: string
        sources: Array<{
            postId: string
            title: string
            content: string
            similarity: number
        }>
    }
    ideaPass?: {
        ideas: string[]
        selectedIdea: string
        meta: {
            usedResearch: boolean
            usedRag: boolean
        },
    }
    anglePass?: {
        angles: string[]
        selectedAngle: string
    }
    outlinePass?: {
        outline: string
        title: string
        hashtags?: string
    }
    draftPass?: {
        draft: string
    }
    enhancePass?: {
        enhanced: string
    }
    scoringPass?: {
        score: number
        scoreBreakdown: {
            clarity: number
            engagement: number
            brandVoice: number
            platformFit: number
            safety: number
        }
        weaknesses: string[]
        suggestedFixes: string[]
    }
    metadata: {
        idea?: string
        productId?: string
        startedAt: Date
        lastUpdatedAt: Date
    }
    expiresAt: Date
}

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
    value: T
    expiresAt: number
}

export interface ICacheService<T = any> {
    set(key: string, value: T, ttl?: number): Promise<void>;
    get<U>(key: string): Promise<U | undefined>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    size(): Promise<number>;
    getOrCreateSession(sessionId: string, metadata?: { idea?: string; productId?: string }): Promise<GenerationSession>;
    updateSession(sessionId: string, updates: Partial<GenerationSession>): Promise<GenerationSession | null>;
    deleteSession(sessionId: string): Promise<boolean>;
    getActiveSessions(): Promise<string[]>;
}