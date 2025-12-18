import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const COURSE_ID = process.env.COURSE_ID!;

export async function GET(req: NextRequest) {
  try {
    const course = await db.course.findUnique({
      where: { id: COURSE_ID },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                youTubeVideoUrl: true,
              },
            },
            quizzes: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, course });
  } catch (err) {
    console.error("❌ Error fetching course:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}