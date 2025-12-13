import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

import { createGetAuthorizationUrlUseCase, redirectWithError } from "../depends"
import { Platform, PLATFORM } from "@/core/domain/marketing/post"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

  // Validate platform parameter
  if (!PLATFORM.includes(platform as Platform)) {
    console.error(`[OAuth Start] Invalid platform: ${platform}`)
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

    const userId = userCookie.value

    // Generate CSRF state token
    const csrfState = Math.random().toString(36).substring(2)

    // Get authorization URL from use case
    const useCase = createGetAuthorizationUrlUseCase()
    const result = await useCase.execute({
      platform: validPlatform,
      userId,
      state: csrfState,
    })

    if (!result.authorizationUrl) {
      return redirectWithError(baseUrl, "connect_failed", validPlatform)
    }

    // Set state cookie for CSRF protection
    const response = NextResponse.redirect(result.authorizationUrl)
    response.cookies.set(`${validPlatform}_oauth_state`, csrfState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
    })

    return response
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "start_unexpected_error"

    return redirectWithError(baseUrl, msg, validPlatform)
  }
}