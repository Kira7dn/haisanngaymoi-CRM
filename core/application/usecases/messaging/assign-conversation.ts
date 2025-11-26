import type { ConversationService } from "@/core/application/interfaces/conversation-service";

export interface AssignConversationRequest {
  conversationId: string;
  agentId: number;
}

export interface AssignConversationResponse {
  success: boolean;
  conversationId: string;
  agentId: number;
}

/**
 * AssignConversationUseCase
 *
 * Assigns a conversation to a specific agent.
 * Used for load balancing and routing customer inquiries to appropriate staff.
 */
export class AssignConversationUseCase {
  constructor(private conversationService: ConversationService) {}

  async execute(request: AssignConversationRequest): Promise<AssignConversationResponse> {
    const { conversationId, agentId } = request;

    // Validate inputs
    if (!conversationId || conversationId.trim() === "") {
      throw new Error("Conversation ID is required");
    }

    if (!agentId || agentId <= 0) {
      throw new Error("Valid agent ID is required");
    }

    // Check if conversation exists
    const conversation = await this.conversationService.getById(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Cannot assign closed conversations
    if (conversation.status === "closed") {
      throw new Error("Cannot assign closed conversations");
    }

    // Perform assignment
    await this.conversationService.assignToAgent(conversationId, agentId);

    return {
      success: true,
      conversationId,
      agentId,
    };
  }
}
