import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

import { ObjectId } from "mongodb"
import { createConnectSocialUseCase, redirectWithError } from "../depends"
import { Platform, PLATFORM } from "@/core/domain/marketing/post"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

  // Validate platform parameter
  if (!PLATFORM.includes(platform as Platform)) {
    console.error(`[OAuth Callback] Invalid platform: ${platform}`)
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400 }
    )
  }

  // Safe to cast after validation
  const validPlatform = platform as Platform

  const baseUrl = process.env.APP_URL || request.nextUrl.origin

  console.log(`[OAuth Callback] Starting callback for platform: ${validPlatform}`)

  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const error = url.searchParams.get("error")

    console.log(`[OAuth Callback] Received params - code: ${!!code}, state: ${!!state}, error: ${error}`)

    if (error) {
      console.error(`[OAuth Callback] OAuth error for ${validPlatform}:`, error)
      return redirectWithError(baseUrl, `oauth_error:${error}`, validPlatform)
    }

    if (!code) {
      console.error(`[OAuth Callback] Missing code for ${validPlatform}`)
      return redirectWithError(baseUrl, "missing_code", validPlatform)
    }

    // Validate state anti-CSRF
    const cookieStore = await cookies()
    const stateCookieKey = `${validPlatform}_oauth_state`
    const storedState = cookieStore.get(stateCookieKey)

    console.log(`[OAuth Callback] Validating state - cookie key: ${stateCookieKey}, stored: ${!!storedState}`)

    if (!storedState || storedState.value !== state) {
      console.error(`[OAuth Callback] Invalid state for ${validPlatform} - expected: ${storedState?.value}, received: ${state}`)
      return redirectWithError(baseUrl, "invalid_state", validPlatform)
    }

    // Ensure user is logged in
    const userCookie = cookieStore.get("admin_user_id")
    if (!userCookie) {
      console.error(`[OAuth Callback] User not authenticated for ${validPlatform}`)
      return redirectWithError(baseUrl, "not_authenticated", validPlatform)
    }

    const userId = userCookie.value
    console.log(`[OAuth Callback] User authenticated: ${userId}`)

    // Usecase factory per platform
    const connectUseCase = createConnectSocialUseCase()

    console.log(`[OAuth Callback] Executing connect use case for ${validPlatform}`)
    const result = await connectUseCase.execute({
      userId: new ObjectId(userId),
      platform: validPlatform,
      code,
    })

    console.log(`[OAuth Callback] Connect result - success: ${result.success}, hasSocialAuth: ${!!result.socialAuth}, hasRaw: ${!!result.raw}`)

    if (!result.success) {
      console.error(`[OAuth Callback] Connect failed for ${validPlatform}:`, result.message)
      return redirectWithError(
        baseUrl,
        result.message ?? "connect_failed",
        validPlatform
      )
    }

    // SUCCESS — All pages already saved in ConnectSocialAccountUseCase
    cookieStore.delete(stateCookieKey)
    console.log(`[OAuth Callback] State cookie deleted for ${validPlatform}`)

    console.log(`[OAuth Callback] Redirecting to success page for ${validPlatform}`)
    return NextResponse.redirect(
      `${baseUrl}/crm/social/connections?success=true&platform=${validPlatform}`
    )
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "callback_unexpected_error"

    console.error(`[OAuth Callback] Unexpected error for ${validPlatform}:`, err)
    return redirectWithError(baseUrl, msg, validPlatform)
  }
}
