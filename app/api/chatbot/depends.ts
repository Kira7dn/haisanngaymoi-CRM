import { ChatbotRepository } from "@/infrastructure/repositories/chatbot/chatbot-repo";
import { QueryChatbotUseCase } from "@/core/application/usecases/chatbot/query-chatbot";
import type { ChatbotService } from "@/core/application/interfaces/chatbot/chatbot-service";

/**
 * Factory function to create chatbot repository instance
 */
const createChatbotRepository = async (): Promise<ChatbotService> => {
  return new ChatbotRepository();
};

/**
 * Use case factory for querying chatbot
 */
export const queryChatbotUseCase = async () => {
  const service = await createChatbotRepository();
  return new QueryChatbotUseCase(service);
};
