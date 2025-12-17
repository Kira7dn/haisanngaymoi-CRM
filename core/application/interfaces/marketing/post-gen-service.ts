
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
        context: string
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
    }
    anglePass?: {
        angles: string[]
        selectedAngle: string
    }
    outlinePass?: {
        outline: string
        sections: string[]
        title: string
    }
    draftPass?: {
        draft: string
        wordCount: number
    }
    enhancePass?: {
        enhanced: string
        improvements: string[]
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
        title?: string
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
    set(key: string, value: T, ttl?: number): void;
    get<U>(key: string): U | undefined;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
    getOrCreateSession(sessionId: string, metadata?: { title?: string }): GenerationSession;
    updateSession(sessionId: string, updates: Partial<GenerationSession>): void;
    deleteSession(sessionId: string): boolean;
    getActiveSessions(): string[];
}