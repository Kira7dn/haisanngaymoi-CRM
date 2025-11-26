import { NextRequest, NextResponse } from "next/server";
import { sendMessageUseCase } from "../depends";

/**
 * POST /api/messaging/send
 * Send a message to a customer via a specific platform
 *
 * Request body:
 * {
 *   conversationId: string;
 *   platform: Platform;
 *   platformUserId: string;
 *   content?: string;
 *   attachments?: { type: string; url: string; name?: string }[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      conversationId,
      platform,
      platformUserId,
      content,
      attachments,
    } = body;

    // Validate required fields
    if (!conversationId || !platform || !platformUserId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "conversationId, platform, and platformUserId are required"
        },
        { status: 400 }
      );
    }

    // At least content or attachments must be provided
    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        {
          error: "Invalid message",
          details: "Message must have either content or attachments"
        },
        { status: 400 }
      );
    }

    const useCase = await sendMessageUseCase();

    const result = await useCase.execute({
      conversationId,
      platform,
      platformUserId,
      content: content || "",
      attachments,
    });

    return NextResponse.json({
      message: result.message,
      success: true,
    });
  } catch (error) {
    console.error("Failed to send message:", error);

    // Check if it's a validation error
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
