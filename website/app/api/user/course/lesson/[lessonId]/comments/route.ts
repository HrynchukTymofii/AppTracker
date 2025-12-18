import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/expo-auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params

    if (!lessonId) {
      return new NextResponse("Lesson ID is required", { status: 400 })
    }

    const comments = await db.comment.findMany({
      where: { lessonId, parentId: null },
      include: {
        author: { select: { name: true, image: true } },
        replies: {
          include: {
            author: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("❌ Failed to fetch lesson comments:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const auth = requireAuth(req)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    if (!lessonId || !userId) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const { content, parentId } = await req.json()
    if (!content || content.trim().length === 0) {
      return new NextResponse("Content is required", { status: 400 })
    }

    // Limit nesting: only allow replies to top-level comments
    if (parentId) {
      const parent = await db.comment.findUnique({ where: { id: parentId } })
      if (!parent || parent.parentId) {
        return new NextResponse("Invalid parent comment", { status: 400 })
      }
    }

    const newComment = await db.comment.create({
      data: {
        content,
        lessonId,
        authorId: userId,
        parentId: parentId ?? null,
      },
      include: {
        author: { select: { userId: true, name: true, image: true } },
        replies: true,
      },
    })

    return NextResponse.json(newComment)
  } catch (error) {
    console.error("❌ Failed to post comment:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
