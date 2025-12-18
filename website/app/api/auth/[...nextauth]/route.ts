import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// import NextAuth from "next-auth"
// import GoogleProvider from "next-auth/providers/google"
// import AppleProvider from "next-auth/providers/apple"
// import CredentialsProvider from "next-auth/providers/credentials"
// import { db } from "@/lib/db"
// import bcrypt from "bcryptjs"

// const handler = NextAuth({
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//     // AppleProvider({
//     //   clientId: process.env.APPLE_ID!,
//     //   clientSecret: process.env.APPLE_SECRET!,
//     // }),
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           return null
//         }

//         const user = await db.user.findFirst({
//             where: {
//                 platform: 'SATecosystem',
//                 email: credentials.email
//             }
//         })

//         if (!user || !user.password) return null

//         const isValid = await bcrypt.compare(credentials.password, user.password)
//         if (!isValid) return null

//         return {
//             id: user.userId, // this is required!
//             name: user.name,
//             email: user.email,
//             image: user.image,
//             userId: user.userId,
//             isPro: user.isPro,
//             league: user.league,
//             points: user.points,
//             platform: user.platform,
//         }
//       },
//     }),
//   ],
//   pages: {
//     signIn: "/login",
//   },
//   callbacks: {
//     async signIn({ user, account }) {
//         if (account?.provider === "google" || account?.provider === "apple") {
//         const existingUser = await db.user.findFirst({
//             where: {
//             email: user.email!,
//             platform: 'SATecosystem',
//             },
//         });

//         if (!existingUser) {
//             // Create the user with default values
//             await db.user.create({
//             data: {
//                 email: user.email!,
//                 name: user.name || "Anonymous",
//                 image: user.image,
//                 platform: 'SATecosystem',
//             },
//             });
//         }
//         }

//         return true;
//     },

//     async jwt({ token, user }) {
//         // Add custom fields to token if needed
//         if (user) {
//         const customUser = user as any
//         token.userId = customUser.userId
//         token.email = user.email
//         token.name = user.name
//         token.picture = user.image
//         }
//         return token
//     },

//     async session({ session, token }) {
//         // Propagate fields from token to session
//         (session.user as any).userId = token.userId
//         session.user.email = token.email
//         session.user.name = token.name
//         session.user.image = token.picture
//         return session
//     },
//     }
// })

// export { handler as GET, handler as POST }
