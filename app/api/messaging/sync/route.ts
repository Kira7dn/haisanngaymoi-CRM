import { NextRequest, NextResponse } from "next/server";
import { syncMessagesUseCase } from "../depends";

/**
 * POST /api/messaging/sync
 * Synchronize message history from a platform
 *
 * Request body:
 * {
 *   conversationId: string;
 *   platform: Platform;
 *   platformUserId: string;
 *   limit?: number;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, platform, platformUserId, limit } = body;

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

    if (!platform) {
      return NextResponse.json(
        {
          error: "Missing required field",
          details: "platform is required"
        },
        { status: 400 }
      );
    }

    if (!platformUserId) {
      return NextResponse.json(
        {
          error: "Missing required field",
          details: "platformUserId is required"
        },
        { status: 400 }
      );
    }

    const useCase = await syncMessagesUseCase();

    const result = await useCase.execute({
      conversationId,
      platform,
      platformUserId,
      limit: limit ? Number(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      messagesSynced: result.messagesSynced,
      newMessages: result.newMessages,
      existingMessages: result.existingMessages,
    });
  } catch (error) {
    console.error("Failed to sync messages:", error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (
        error.message.includes("required") ||
        error.message.includes("mismatch")
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      if (error.message.includes("Failed to sync")) {
        return NextResponse.json(
          { error: error.message },
          { status: 502 } // Bad Gateway - platform API error
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to sync messages" },
      { status: 500 }
    );
  }
}
