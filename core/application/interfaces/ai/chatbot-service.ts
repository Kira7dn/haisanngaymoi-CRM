import type { ChatMessage, ChatConversation, MessageIntent } from "@/core/domain/ai/chatbot";

/**
 * Chatbot query request
 */
export interface ChatbotQueryRequest {
  message: string;
  userId: string;
  conversationId?: string;
  useAI?: boolean; // If true, use AI (Claude). If false, use rule-based patterns
}

/**
 * Chatbot query response
 */
export interface ChatbotQueryResponse {
  message: ChatMessage;
  intent: MessageIntent;
  confidence: number;
  conversationId: string;
}

/**
 * Chatbot service interface
 */
export interface ChatbotService {
  /**
   * Process a chatbot query and generate response
   */
  query(request: ChatbotQueryRequest): Promise<ChatbotQueryResponse>;

  /**
   * Get conversation history
   */
  getConversation(conversationId: string): Promise<ChatConversation | null>;

  /**
   * Get user's conversations
   */
  getUserConversations(userId: string): Promise<ChatConversation[]>;

  /**
   * Archive a conversation
   */
  archiveConversation(conversationId: string): Promise<boolean>;
}
