import { SinglePassGenUseCase } from "@/core/application/usecases/marketing/post/generate-post/generate-post-single-pass"
import { LLMService } from "@/infrastructure/adapters/llm-service"
import { CacheService } from "@/infrastructure/adapters/cache-service"
import { BrandMemoryRepository } from "@/infrastructure/repositories/brand-memory-repo"
import { PerplexityService as PerplexityServiceImpl } from "@/infrastructure/adapters/perplexity-service"

import type { ILLMService } from "@/core/application/interfaces/marketing/post-gen-service"
import type { ICacheService } from "@/core/application/interfaces/marketing/post-gen-service"
import type { BrandMemoryService } from "@/core/application/interfaces/brand-memory-service"
import { StreamMultiPassUseCase } from "@/core/application/usecases/marketing/post/generate-post/stream-gen-multi-pass"
import { PerplexityService, ResearchTopicUseCase } from "@/core/application/usecases/marketing/post/research-topic"

/**
 * ======================================================
 * Singleton Instances
 * ======================================================
 */
let llmServiceInstance: ILLMService | null = null
let cacheServiceInstance: ICacheService | null = null
let brandMemoryRepoInstance: BrandMemoryService | null = null
let streamMultiPassUseCaseInstance: StreamMultiPassUseCase | null = null
let singlePassGenUseCaseInstance: SinglePassGenUseCase | null = null
let perplexityServiceInstance: PerplexityService | null = null
let researchTopicUseCaseInstance: ResearchTopicUseCase | null = null

/**
 * ======================================================
 * Services
 * ======================================================
 */
const getLLMService = (): ILLMService => {
    if (!llmServiceInstance) {
        llmServiceInstance = new LLMService()
    }
    return llmServiceInstance
}

const getCacheService = (): ICacheService => {
    if (!cacheServiceInstance) {
        cacheServiceInstance = new CacheService()
    }
    return cacheServiceInstance
}

const getBrandMemoryRepo = (): BrandMemoryService => {
    if (!brandMemoryRepoInstance) {
        brandMemoryRepoInstance = new BrandMemoryRepository()
    }
    return brandMemoryRepoInstance
}

const getPerplexityService = (): PerplexityService => {
    if (!perplexityServiceInstance) {
        perplexityServiceInstance = new PerplexityServiceImpl()
    }
    return perplexityServiceInstance
}

/**
 * ======================================================
 * UseCases
 * ======================================================
 */
export const createStreamMultiPassUseCase = async (): Promise<StreamMultiPassUseCase> => {
    if (!streamMultiPassUseCaseInstance) {
        const llmService = getLLMService()
        const cacheService = getCacheService()

        streamMultiPassUseCaseInstance = new StreamMultiPassUseCase(
            llmService,
            cacheService,
        )
    }
    return streamMultiPassUseCaseInstance
}

export const createSinglePassGenUseCase = async (): Promise<SinglePassGenUseCase> => {
    if (!singlePassGenUseCaseInstance) {
        const llmService = getLLMService()
        const brandMemoryRepo = getBrandMemoryRepo()

        singlePassGenUseCaseInstance = new SinglePassGenUseCase(
            llmService,
            brandMemoryRepo
        )
    }
    return singlePassGenUseCaseInstance
}

export const createResearchTopicUseCase = async (): Promise<ResearchTopicUseCase> => {
    if (!researchTopicUseCaseInstance) {
        const llmService = getLLMService()
        const perplexityService = getPerplexityService()

        researchTopicUseCaseInstance = new ResearchTopicUseCase(
            llmService,
            perplexityService
        )
    }
    return researchTopicUseCaseInstance
}