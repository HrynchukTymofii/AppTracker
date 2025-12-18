import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/expo-auth";
import { db } from "@/lib/db";

/**
 * POST /api/user/course/quiz/updates
 * 
 * Returns quizzes that have updates compared to local updatedAt values.
 * Expects JSON body: { localUpdatedAt: { [quizId: string]: string } }
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const localUpdatedAt: Record<string, string> = body.localUpdatedAt || {};

    const quizIds = Object.keys(localUpdatedAt);

    if (!quizIds.length) {
      return NextResponse.json({ updates: [] }); // nothing to check
    }

    // Get quizzes that might need updates
    const quizzes = await db.quiz.findMany({
      where: {
        id: { in: quizIds },
        isPublished: true,
      },
      select: {
        id: true,
        updatedAt: true,
        totalQuestions: true,
        maxScore: true,
        questions: {
          select: {
            id: true,
            question: true,
            questionType: true,
            questionImageUrl: true,
            imageHeight: true,
            options: true,
            answers: true,
            hint: true,
            points: true,
            position: true,
            hintImageUrl: true,
            note: true,
            updatedAt: true,
          },
        },
      },
    });

    // Compare local updatedAt timestamps
    const updates = quizzes.filter((quiz) => {
      const localTime = localUpdatedAt[quiz.id];
      const serverTime = quiz.updatedAt.toISOString();
      return !localTime || new Date(serverTime).getTime() > new Date(localTime).getTime();
    });

    // Optional: also check if any question is newer than local quiz
    const formattedUpdates = updates.map((quiz) => ({
      id: quiz.id,
      updatedAt: quiz.updatedAt.toISOString(),
      totalQuestions: quiz.totalQuestions,
      maxScore: quiz.maxScore,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        questionImageUrl: q.questionImageUrl,
        localImagePath: null,
        imageHeight: q.imageHeight,
        options: q.options,
        answers: q.answers,
        hint: q.hint,
        points: q.points,
        position: q.position,
        hintImageUrl: q.hintImageUrl,
        note: q.note,
        updatedAt: q.updatedAt.toISOString(),
      })),
    }));

    return NextResponse.json({ updates: formattedUpdates });
  } catch (error) {
    console.error("❌ Failed to fetch quiz updates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
