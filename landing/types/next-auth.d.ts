import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      userId?: string
      isPro?: boolean
      points?: number
      league?: string
      platform?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    userId?: string
    isPro?: boolean
    points?: number
    league?: string
    platform?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    isPro?: boolean
    points?: number
    league?: string
    platform?: string | null
  }
}
