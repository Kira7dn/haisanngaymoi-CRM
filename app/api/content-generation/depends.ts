import { ResearchTopicUseCase } from "@/core/application/usecases/marketing/post/generate-post/research-topic"
import { RetrieveKnowledgeUseCase } from "@/core/application/usecases/marketing/post/retrieve-knowledge"

export const createRetrieveKnowledgeUseCase = async () => {
  return new RetrieveKnowledgeUseCase()
}
