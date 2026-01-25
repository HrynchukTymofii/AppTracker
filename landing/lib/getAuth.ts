
import { getServerSession } from "next-auth/next"
import { lockInAuthOptions } from "./auth"

export async function auth() {
  const session = await getServerSession(lockInAuthOptions)

  return {
    userId: session?.user?.userId ?? null,
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    isPro: session?.user?.isPro ?? null,
  }
}
