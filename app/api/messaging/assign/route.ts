import { NextRequest, NextResponse } from "next/server";
import { assignConversationUseCase } from "../depends";

/**
 * POST /api/messaging/assign
 * Assign a conversation to a specific agent
 *
 * Request body:
 * {
 *   conversationId: string;
 *   agentId: number;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, agentId } = body;

    // Validate required fields
    if (!conversationId) {
      return NextResponse.json(
        {
          error: "Missing required field",
          details: "conversationId is required"
        },
        { status: 400 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        {
          error: "Missing required field",
          details: "agentId is required"
        },
        { status: 400 }
      );
    }

    const useCase = await assignConversationUseCase();

    const result = await useCase.execute({
      conversationId,
      agentId: Number(agentId),
    });

    return NextResponse.json({
      success: result.success,
      conversationId: result.conversationId,
      agentId: result.agentId,
    });
  } catch (error) {
    console.error("Failed to assign conversation:", error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes("required") || error.message.includes("Cannot assign")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to assign conversation" },
      { status: 500 }
    );
  }
}
