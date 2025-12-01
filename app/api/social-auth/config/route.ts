import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createUpdatePlatformConfigUseCase } from "./depends"

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get("admin_user_id")

    if (!userIdCookie) {
      return NextResponse.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { connectionId, platform, platformConfig } = body

    if (!connectionId || !platform || !platformConfig) {
      return NextResponse.json(
        { error: "Missing required fields: connectionId, platform, platformConfig" },
        { status: 400 }
      )
    }

    // Execute use case
    const useCase = await createUpdatePlatformConfigUseCase()
    const result = await useCase.execute({
      connectionId,
      platformConfig,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to update configuration" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Configuration updated successfully",
    })
  } catch (error) {
    console.error("Error updating platform config:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update configuration" },
      { status: 500 }
    )
  }
}
