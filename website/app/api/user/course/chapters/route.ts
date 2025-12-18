import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const COURSE_ID = process.env.COURSE_ID || "";

export async function GET(req: NextRequest) {
  try {
    const chapters = await db.chapter.findMany({
      where: {
        courseId: COURSE_ID,
        isPublished: true,
      },
      orderBy: { position: "asc" },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            content: true,
            videoUrl: true,
            youTubeVideoUrl: true,
            description: true,
            position: true,
            points: true,
            isFree: true,
          },
        },
        quizzes: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            totalQuestions: true,
            maxScore: true,
            position: true,
            isFree: true,
            updatedAt: true
          },
        },
      },
    });

    return NextResponse.json(chapters);
  } catch (err) {
    console.error("❌ Error fetching chapters with lessons & quizzes:", err);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
