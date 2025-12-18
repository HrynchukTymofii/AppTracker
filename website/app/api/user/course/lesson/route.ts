import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, lessonId } = await req.json();

  if (!userId || !lessonId) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  try {
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return new NextResponse("lesson not found", { status: 404 });
    }

    const oldLessonProgress = await db.lessonProgress.findFirst({
      where: {
        userId: userId,
        lessonId: lessonId
      }
    })

    if(!oldLessonProgress){
      const lessonProgress = await db.lessonProgress.create({
        data: {
          userId,
          lessonId,
          completed: true
        },
      });

      return NextResponse.json(lessonProgress);
    }

    return NextResponse.json(oldLessonProgress);
  } catch (error) {
    console.error("Error submitting lesson:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
    const { userId, lessonId, answers } = await req.json();

    if (!userId || !lessonId || !answers) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    try {
      const lesson = await db.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        return new NextResponse("lesson not found", { status: 404 });
      }

      const lessonProgress = await db.lessonProgress.update({
        where: { userId_lessonId: { userId, lessonId } },
        data: {
         
        },
      });

      return NextResponse.json(lessonProgress );
    } catch (error) {
      console.error("Error retrying lesson:", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
}

