"use client"

import { useSession } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    userId: session?.user?.userId,
    user: session?.user,
    isAuthenticated: !!session?.user,
    isPro: session?.user?.isPro
  }
}
