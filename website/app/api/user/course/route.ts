import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/expo-auth";

const COURSE_ID = process.env.COURSE_ID!;

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if ("userId" in authResult === false) {
    return authResult; 
  }
  const { userId } = authResult;

  try {
    const course = await db.course.findUnique({
      where: { id: COURSE_ID },
      select: {
        id: true,
        title: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            userProgress: userId ? { where: { userId } } : true,
            lessons: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: { id: true, title: true, progress: userId ? { where: { userId } } : false },
            },
            quizzes: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: { id: true, title: true, results: userId ? { where: { userId } } : false },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check enrollment if logged in
    let isEnrolled = false;
    if (userId) {
      const enrollment = await db.courseSubscription.findFirst({
        where: { userId, courseId: COURSE_ID },
      });
      isEnrolled = !!enrollment;
    }

    return NextResponse.json({ course, isEnrolled, userId });
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
