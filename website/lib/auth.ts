import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findFirst({
            where: {
                platform: 'SATecosystem',
                email: credentials.email
            }
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
            id: user.userId,
            name: user.name,
            email: user.email,
            image: user.image,
            userId: user.userId,
            isPro: user.isPro,
            league: user.league,
            points: user.points,
            platform: user.platform,
        }
      },
    }),
  ],
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
        if (account?.provider === "google" || account?.provider === "apple") {
        const existingUser = await db.user.findFirst({
            where: {
              email: user.email!,
              platform: 'SATecosystem',
            },
        });

        if (!existingUser) {
            await db.user.create({
              data: {
                  email: user.email!,
                  name: user.name || "Student",
                  image: user.image,
                  platform: 'SATecosystem',
              },
            });
        }
        }

        return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith("/")) return `${baseUrl}${url}`
      return baseUrl
    },

    async jwt({ token, user }) {
        // If logging in for the first time (user is available)
        if (user) {
            token.email = user.email
            token.name = user.name
            token.picture = user.image
        }

        // Always fetch full user from DB based on email + platform
        if (token.email) {
            const existingUser = await db.user.findFirst({
            where: {
                email: token.email,
                platform: 'SATecosystem',
            },
            })

            if (existingUser) {
                token.userId = existingUser.userId
                token.isPro = existingUser.isPro
                token.points = existingUser.points
                token.name = existingUser.name || token.name
                token.picture = existingUser.image || token.picture
            }
        }

        return token
    },


    async session({ session, token }) {
        // Propagate fields from token to session
        (session.user as any).userId = token.userId
          session.user.email = token.email
          session.user.name = token.name
          session.user.image = token.picture
          session.user.isPro = token.isPro
        return session
    },
    }
}