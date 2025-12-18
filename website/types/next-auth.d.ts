import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      userId: string
      name?: string | null
      email?: string | null
      image?: string | null
      isPro?: boolean
      points?: number
    } & DefaultSession["user"]
  }

  interface User {
    userId: string
    isPro?: boolean
    points?: number
  }
}


declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    isPro?: boolean
    points?: number
  }
}
