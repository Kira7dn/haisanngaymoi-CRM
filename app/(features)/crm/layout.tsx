import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { unstable_cache } from "next/cache"
import { createGetCurrentUserUseCase } from "@/app/api/auth/depends"
import { AdminHeader } from "./_components/AdminHeader"
import { CopilotKit } from "@copilotkit/react-core"
import { Toaster } from "@/@shared/ui/toaster"

// Cached user lookup - revalidate every 5 minutes
const getCachedUser = unstable_cache(
  async (userId: string) => {
    const useCase = await createGetCurrentUserUseCase()
    const result = await useCase.execute({ userId })
    return result.user
  },
  ['current-user'],
  { revalidate: 300, tags: ['user'] }
)

export default async function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("admin_user_id")?.value

  if (!userId) {
    redirect('/login')
  }

  const user = await getCachedUser(userId)
  if (!user) {
    redirect('/login')
  }

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" publicLicenseKey="ck_pub_9f183f4c59f3d2b59e41ff75d5aace3e">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminHeader userName={user?.name} userRole={user?.role} />
        <main>{children}</main>
        <Toaster />
      </div>
    </CopilotKit>

  )
}
