import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/expo-auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{lessonId: string}> }
) {
  try {
    const { lessonId } = await params
    const auth = requireAuth(req)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    if (!userId || !lessonId) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const progress = await db.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        userId,
        lessonId,
        completed: true,
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error("❌ Error marking lesson as done:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
