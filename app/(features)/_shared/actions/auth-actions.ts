"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createGetCurrentUserUseCase } from "@/app/api/auth/depends"

export async function getCurrentUserAction() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("admin_user_id")?.value
  console.log("userId:",userId)
  if (!userId) {
    return null
  }

  try {
    const useCase = await createGetCurrentUserUseCase()
    const result = await useCase.execute({ userId })
    console.log("result:",result);
    
    return result.user
  } catch (error) {
    return null
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()

  cookieStore.delete("admin_user_id")
  cookieStore.delete("admin_user_role")

  redirect("/admin/login")
}
