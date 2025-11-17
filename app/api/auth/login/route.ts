import { NextRequest, NextResponse } from "next/server"
import { createLoginUseCase } from "../depends"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const useCase = await createLoginUseCase()
    const result = await useCase.execute(body)

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.message || 'Authentication failed' },
        { status: 401 }
      )
    }

    // Validate user data
    if (!result.user.id || typeof result.user.role === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 500 }
      )
    }

    // Set session cookie (simple session - can be improved with JWT)
    const cookieStore = await cookies()
    
    try {
      cookieStore.set("admin_user_id", result.user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })

      cookieStore.set("admin_user_role", result.user.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })

      const responseData: Record<string, unknown> = {
        id: result.user.id,
        role: result.user.role
      }

      // Add optional fields if they exist
      if ('email' in result.user) {
        responseData.email = result.user.email
      }
      if ('name' in result.user) {
        responseData.name = result.user.name
      }

      return NextResponse.json(responseData, { status: 200 })
    } catch (error) {
      console.error("Set cookie error:", error)
      return NextResponse.json(
        { error: "Failed to set authentication cookies" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    )
  }
}
