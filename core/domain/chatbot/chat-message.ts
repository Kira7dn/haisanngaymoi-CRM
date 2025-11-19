/**
 * Chat message role types
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * Chat message intent/category
 */
export type MessageIntent =
  | "greeting"
  | "revenue_query"
  | "customer_query"
  | "order_query"
  | "product_query"
  | "staff_performance"
  | "campaign_analytics"
  | "ticket_query"
  | "general_help"
  | "unknown";

/**
 * Chat message domain entity
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  intent?: MessageIntent;
  confidence?: number; // 0-1 confidence score for intent classification
  metadata?: Record<string, any>; // Additional context (e.g., query parameters, data sources)
  createdAt: Date;
}

/**
 * Chat conversation
 */
export interface ChatConversation {
  id: string;
  userId: string; // Admin/Staff user ID
  messages: ChatMessage[];
  status: "active" | "resolved" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chatbot query patterns for rule-based matching
 */
export const CHATBOT_PATTERNS: Record<MessageIntent, RegExp[]> = {
  greeting: [
    /^(hi|hello|hey|greetings)/i,
    /(good\s+(morning|afternoon|evening))/i,
  ],
  revenue_query: [
    /(revenue|sales|income|earnings)/i,
    /(how much|total|sum).*(revenue|sales|money)/i,
    /(today|yesterday|this week|this month).*(revenue|sales)/i,
  ],
  customer_query: [
    /(customer|client|buyer)/i,
    /(how many|total|count).*(customer|client)/i,
    /(new|active|inactive).*(customer|client)/i,
    /(churn|retention|rfm)/i,
  ],
  order_query: [
    /(order|purchase)/i,
    /(how many|total|count).*(order|purchase)/i,
    /(pending|confirmed|completed|cancelled).*(order)/i,
  ],
  product_query: [
    /(product|item)/i,
    /(top|best|popular).*(product|item|selling)/i,
    /(stock|inventory)/i,
  ],
  staff_performance: [
    /(staff|employee|team|performance)/i,
    /(who.*best|top.*(staff|employee))/i,
    /(leaderboard|ranking)/i,
  ],
  campaign_analytics: [
    /(campaign|marketing|promotion)/i,
    /(roi|performance|effectiveness).*(campaign)/i,
  ],
  ticket_query: [
    /(ticket|support|issue|problem)/i,
    /(open|pending|resolved).*(ticket)/i,
    /(how many|count).*(ticket)/i,
  ],
  general_help: [
    /^(help|assist|support|guide)/i,
    /(how to|how do i|can you)/i,
    /(what can you|what do you)/i,
  ],
  unknown: [], // Default fallback
};

/**
 * Classify message intent based on patterns
 */
export function classifyIntent(message: string): { intent: MessageIntent; confidence: number } {
  const normalizedMessage = message.trim().toLowerCase();

  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(CHATBOT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          intent: intent as MessageIntent,
          confidence: 0.85, // High confidence for pattern match
        };
      }
    }
  }

  return {
    intent: "unknown",
    confidence: 0.0,
  };
}

/**
 * Generate chatbot response ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate conversation ID
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validation function for Chat Message
 */
export function validateChatMessage(data: Partial<ChatMessage>): string[] {
  const errors: string[] = [];

  if (!data.conversationId || data.conversationId.trim().length === 0) {
    errors.push("Conversation ID is required");
  }

  if (!data.role) {
    errors.push("Message role is required");
  }

  const validRoles: MessageRole[] = ["user", "assistant", "system"];
  if (data.role && !validRoles.includes(data.role)) {
    errors.push(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  if (!data.content || data.content.trim().length === 0) {
    errors.push("Message content is required");
  }

  if (data.content && data.content.length > 10000) {
    errors.push("Message content must be less than 10000 characters");
  }

  if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 1)) {
    errors.push("Confidence must be between 0 and 1");
  }

  return errors;
}
