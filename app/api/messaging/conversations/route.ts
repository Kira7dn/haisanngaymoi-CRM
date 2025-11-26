import { NextRequest, NextResponse } from "next/server";
import { createConversationRepository } from "../depends";

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

    return NextResponse.json({
      conversations: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
