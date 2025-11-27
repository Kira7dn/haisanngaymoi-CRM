import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { createSaveYouTubeTokenUseCase } from "../depends"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Lấy base URL từ env hoặc origin request
    const baseUrl = process.env.APP_URL || request.nextUrl.origin

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/crm/social/connections?error=${encodeURIComponent(error)}&platform=youtube`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/crm/social/connections?error=missing_code&platform=youtube`
      )
    }

    const cookieStore = await cookies()
    const storedState = cookieStore.get("youtube_oauth_state")

    if (!storedState || storedState.value !== state) {
      return NextResponse.redirect(
        `${baseUrl}/crm/social/connections?error=invalid_state&platform=youtube`
      )
    }

    const userIdCookie = cookieStore.get("admin_user_id")
    if (!userIdCookie) {
      return NextResponse.redirect(
        `${baseUrl}/crm/social/connections?error=not_authenticated&platform=youtube`
      )
    }

    const userId = new ObjectId(userIdCookie.value)
    const tokenResponse = await exchangeCodeForToken(code)

    if (!tokenResponse.success || !tokenResponse.data) {
      return NextResponse.redirect(
        `${baseUrl}/crm/social/connections?error=${encodeURIComponent(
          tokenResponse.error || "token_exchange_failed"
        )}&platform=youtube`
      )
    }

    const saveTokenUseCase = await createSaveYouTubeTokenUseCase()
    const result = await saveTokenUseCase.execute({
      userId,
      openId: tokenResponse.data.user_id, // đã fix lấy từ Google API
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresInSeconds: tokenResponse.data.expires_in,
      scope: tokenResponse.data.scope,
    })

    if (!result.success) {
      return NextResponse.redirect(
        `${baseUrl}/crm/social/connections?error=${encodeURIComponent(
          result.message || "save_token_failed"
        )}&platform=youtube`
      )
    }

    const response = NextResponse.redirect(
      `${baseUrl}/crm/social/connections?success=true&platform=youtube`
    )
    response.cookies.delete("youtube_oauth_state")

    return response
  } catch (error) {
    console.error("YouTube OAuth callback error:", error)
    const baseUrl = process.env.APP_URL || request.nextUrl.origin
    return NextResponse.redirect(
      `${baseUrl}/crm/social/connections?error=${encodeURIComponent(
        error instanceof Error ? error.message : "callback_failed"
      )}&platform=youtube`
    )
  }
}

async function exchangeCodeForToken(code: string): Promise<{
  success: boolean
  data?: {
    access_token: string
    refresh_token: string
    expires_in: number
    user_id: string
    scope: string
  }
  error?: string
}> {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI

  if (!clientId || !clientSecret) {
    return { success: false, error: "YouTube configuration missing" }
  }

  try {
    if (!redirectUri) {
      throw new Error("Redirect URI is not configured")
    }

    const params = new URLSearchParams()
    params.append("code", code)
    params.append("client_id", clientId)
    params.append("client_secret", clientSecret)
    params.append("redirect_uri", redirectUri)
    params.append("grant_type", "authorization_code")

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      return {
        success: false,
        error: tokenData.error_description || tokenData.error || "Token exchange failed",
      }
    }

    // Lấy thông tin user: sử dụng endpoint Google UserInfo
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      return { success: false, error: `Failed to fetch user info: ${errorText}` }
    }

    const userInfo = await userInfoResponse.json()

    // Google OAuth2 v2 endpoint trả về 'id' field
    // OpenID Connect endpoint trả về 'sub' field
    // Cả hai đều là unique identifier cho Google Account
    const userId = userInfo.id || userInfo.sub
    if (!userId) {
      return {
        success: false,
        error: `Failed to get user id from Google. Response: ${JSON.stringify(userInfo)}`
      }
    }

    return {
      success: true,
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in || 3600,
        user_id: userId,
        scope: tokenData.scope || "",
      },
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" }
  }
}
