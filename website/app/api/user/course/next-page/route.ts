import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST method for the API
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, courseId, currentChapterId, currentItemId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ error: "Missing userId or courseId" }, { status: 400 });
    }

    const chapters = await db.chapter.findMany({
      where: { courseId, isPublished: true },
      orderBy: { position: "asc" },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          include: { progress: { where: { userId } } },
        },
        quizzes: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          include: { results: { where: { userId, completed: true } } },
        },
      },
    });

    let lastItem = null;
    let foundCurrent = false;

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
        if (foundCurrent) {
          return NextResponse.json(item);
        }

        console.log(item.id + "===" + currentItemId + "==" + item.id === currentItemId)
        console.log(chapter.id + "===" + currentChapterId + "==" + chapter.id === currentChapterId)

        if (item.id === currentItemId && chapter.id === currentChapterId) {
          foundCurrent = true;
        }

        lastItem = item;
      }
    }

    foundCurrent = false;

    if (foundCurrent) {
      for (const chapter of chapters) {
        if (chapter.id === currentChapterId) {
          foundCurrent = true;
          continue;
        }
        if (foundCurrent && chapter.lessons.length + chapter.quizzes.length > 0) {
          const firstItemInNextChapter = [
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
          ].sort((a, b) => a.position - b.position)[0];

          if (firstItemInNextChapter) {
            return NextResponse.json(firstItemInNextChapter);
          }
        }
      }
    }

    // If at the last item in the course, return itself
    return NextResponse.json(lastItem);
  } catch (error) {
    console.error("Error finding next item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
