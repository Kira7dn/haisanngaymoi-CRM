import { ResourceRepository } from "@/infrastructure/repositories/marketing/resource-repo"
import type { ResourceService } from "@/core/application/usecases/marketing/post/resource/resource-service.interfaces"

import { UploadResourceUseCase } from "@/core/application/usecases/marketing/post/resource/upload-resource"
import { GetResourcesUseCase } from "@/core/application/usecases/marketing/post/resource/get-resources"
import { DeleteResourceUseCase } from "@/core/application/usecases/marketing/post/resource/delete-resource"
import { StoreContentEmbeddingUseCase } from "@/core/application/usecases/marketing/post/content-memory/store-content-embedding"

/**
 * ======================================================
 * Singleton Instances
 * ======================================================
 */
let resourceServiceInstance: ResourceService | null = null
let storeContentEmbeddingUseCaseInstance: StoreContentEmbeddingUseCase | null = null

/**
 * ======================================================
 * Repositories
 * ======================================================
 */
const getResourceService = async (): Promise<ResourceService> => {
  if (!resourceServiceInstance) {
    resourceServiceInstance = new ResourceRepository()
  }
  return resourceServiceInstance
}

/**
 * ======================================================
 * Content Embedding Service
 * ======================================================
 */
export const getStoreContentEmbeddingUseCase = (): StoreContentEmbeddingUseCase => {
  if (!storeContentEmbeddingUseCaseInstance) {
    storeContentEmbeddingUseCaseInstance = new StoreContentEmbeddingUseCase()
  }
  return storeContentEmbeddingUseCaseInstance
}

/**
 * ======================================================
 * UseCases
 * ======================================================
 */

// 🔹 Upload Resource
export const uploadResourceUseCase = async (): Promise<UploadResourceUseCase> => {
  const service = await getResourceService()
  const storeContentUseCase = getStoreContentEmbeddingUseCase()
  return new UploadResourceUseCase(service, storeContentUseCase)
}

// 🔹 Get Resources
export const getResourcesUseCase = async (): Promise<GetResourcesUseCase> => {
  const service = await getResourceService()
  return new GetResourcesUseCase(service)
}

// 🔹 Delete Resource
export const deleteResourceUseCase = async (): Promise<DeleteResourceUseCase> => {
  const service = await getResourceService()
  return new DeleteResourceUseCase(service)
}
