import { authOptions } from "./auth"
import { getServerSession } from "next-auth/next"

export async function auth() {
  const session = await getServerSession(authOptions)

  return {
    userId: session?.user?.userId ?? null,
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    isPro: session?.user?.isPro ?? null,
  }
}
