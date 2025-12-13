import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

import { createRevokeSocialAccountUseCase, redirectWithError } from "../depends"
import { ObjectId } from "mongodb"
import { Platform, PLATFORM } from "@/core/domain/marketing/post"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

  // Validate platform parameter
  if (!PLATFORM.includes(platform as Platform)) {
    console.error(`[OAuth Disconnect] Invalid platform: ${platform}`)
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400 }
    )
  }

  // Safe to cast after validation
  const validPlatform = platform as Platform

  const baseUrl = process.env.APP_URL || request.nextUrl.origin

  try {
    const cookieStore = await cookies()
    // Ensure user is logged in
    const userCookie = cookieStore.get("admin_user_id")
    if (!userCookie) {
      return redirectWithError(baseUrl, "not_authenticated", validPlatform)
    }

    const userId = new ObjectId(userCookie.value)

    // Use case to disconnect social account
    const useCase = createRevokeSocialAccountUseCase()
    const result = await useCase.execute({
      userId,
      platform: validPlatform,
    })

    if (!result.success) {
      return redirectWithError(
        baseUrl,
        result.message ?? "disconnect_failed",
        validPlatform
      )
    }

    return NextResponse.json(
      { message: result.message || "Account disconnected successfully" },
      { status: 200 }
    )
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "disconnect_unexpected_error"

    return redirectWithError(baseUrl, msg, validPlatform)
  }
}

