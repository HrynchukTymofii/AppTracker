import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST method for the API
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ error: "Missing userId or courseId" }, { status: 400 });
    }

    const chapters = await db.chapter.findMany({
      where: { courseId, isPublished: true },
      orderBy: { position: "asc" },
      include: {
        lessons: {
          where: {isPublished: true},
          orderBy: { position: "asc" },
          include: { progress: { where: { userId } } },
        },
        quizzes: {
          where: {isPublished: true},
          orderBy: { position: "asc" },
          include: { results: { where: { userId, completed: true } } },
        },
      },
    });

    let lastItem = null;

    for (const chapter of chapters) {
      const items = [
        ...chapter.lessons.map((lesson) => ({
          type: "lesson",
          id: lesson.id,
          chapterId: chapter.id,
          position: lesson.position,
          completed: lesson.progress.length > 0 && lesson.progress[0].completed,
        })),
        ...chapter.quizzes.map((quiz) => ({
          type: "quiz",
          id: quiz.id,
          chapterId: chapter.id,
          position: quiz.position,
          completed: quiz.results.length > 0 && quiz.results[0].completed,
        })),
      ].sort((a, b) => a.position - b.position);

      for (const item of items) {
        if (!item.completed) {
          return NextResponse.json(item); // Return first incomplete item
        }
        lastItem = item;
      }
    }

    // If all items are completed, return the last item
    return NextResponse.json(lastItem);
  } catch (error) {
    console.error("Error finding next incomplete item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
