import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { createGetTikTokAuthUseCase } from "@/app/api/auth/tiktok/depends"
import TikTokConnection from "./_components/TikTokConnection"

export default async function TikTokIntegrationPage() {
  // Get current user ID from session
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get("admin_user_id")

  if (!userIdCookie) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Please login to access TikTok integration
          </p>
        </div>
      </div>
    )
  }

  const userId = new ObjectId(userIdCookie.value)

  // Check if TikTok is already connected
  const useCase = await createGetTikTokAuthUseCase()
  const result = await useCase.execute({ userId })

  const isConnected = result.success && !!result.socialAuth
  const authData = result.socialAuth
    ? JSON.parse(JSON.stringify(result.socialAuth))
    : null

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">TikTok Integration</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Connect your TikTok account to publish and manage content
        </p>
      </div>

      {/* Connection Status */}
      <TikTokConnection isConnected={isConnected} authData={authData} />
    </div>
  )
}
