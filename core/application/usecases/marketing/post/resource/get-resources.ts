/**
 * Get Resources Use Case
 * Retrieves list of resources for a user
 */

import type { ResourceService } from "@/core/application/usecases/marketing/post/resource/resource-service.interfaces"
import type { Resource } from "@/core/domain/marketing/resource"

export interface GetResourcesRequest {
  userId: string
}

export interface GetResourcesResponse {
  resources: Resource[]
}

/**
 * GetResourcesUseCase
 * Fetches all resources for a specific user
 */
export class GetResourcesUseCase {
  constructor(private resourceService: ResourceService) { }

  async execute(request: GetResourcesRequest): Promise<GetResourcesResponse> {
    const resources = await this.resourceService.getAll(request.userId)
    return { resources }
  }
}
