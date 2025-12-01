import { NextRequest, NextResponse } from "next/server";
import { createConversationRepository } from "../depends";
import { getCustomerByIdUseCase } from "../../customers/depends";

/**
 * GET /api/messaging/conversations
 * Fetch all conversations with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const assignedTo = searchParams.get("assignedTo");

    const conversationService = await createConversationRepository();

    // Get all conversations
    const conversations = await conversationService.getAll();

    // Apply filters if provided
    let filtered = conversations;

    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    if (platform) {
      filtered = filtered.filter(c => c.platform === platform);
    }

    if (assignedTo) {
      const assignedToNumber = parseInt(assignedTo, 10);
      filtered = filtered.filter(c => c.assignedTo === assignedToNumber);
    }

    // Sort by last message time (most recent first)
    filtered.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    // Populate customer data for each conversation
    const customerUseCase = await getCustomerByIdUseCase();
    const conversationsWithCustomers = await Promise.all(
      filtered.map(async (conversation) => {
        // Use contactId if available, fallback to customerId for backward compatibility
        const customerIdToFetch = conversation.contactId || conversation.customerId;

        try {
          const { customer } = await customerUseCase.execute({ id: customerIdToFetch });
          return {
            ...conversation,
            customer: customer ? {
              id: customer.id,
              name: customer.name,
              avatar: customer.avatar,
            } : null,
          };
        } catch (error) {
          console.error(`Failed to fetch customer ${customerIdToFetch}:`, error);
          return {
            ...conversation,
            customer: null,
          };
        }
      })
    );

    return NextResponse.json({
      conversations: conversationsWithCustomers,
      total: conversationsWithCustomers.length,
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
