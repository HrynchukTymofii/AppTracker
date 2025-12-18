import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

import { db } from "@/lib/db"
import { deleteUserAccount } from "@/app/actions/user-actions"

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }

    const user = await db.user.findUnique({
      where: { userId: decoded.id },
      select: {
        userId: true,
        name: true,
        email: true,
        image: true,
        isPro: true,
        league: true,
        points: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("❌ Error verifying token:", error)
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }
}


export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }

    const result = await deleteUserAccount(decoded.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("❌ Invalid token on delete:", err)
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }
}