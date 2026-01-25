import NextAuth from "next-auth"
import { lockInAuthOptions } from "@/lib/auth"

const handler = NextAuth(lockInAuthOptions)

export { handler as GET, handler as POST }
