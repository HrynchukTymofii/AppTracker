import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/expo-auth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    // --- Fetch lesson progress ---
    const lessonProgress = await db.lessonProgress.findMany({
      where: { userId },
      select: {
        id: true,
        lessonId: true,
        completed: true,
        updatedAt: true,
      },
    });

    // --- Fetch quiz results ---
    const quizResults = await db.quizResult.findMany({
      where: { userId },
      select: {
        id: true,
        quizId: true,
        answers: true,
        score: true,
        completed: true,
        attemptCount: true,
        updatedAt: true,
      },
    });

    // --- Fetch user quiz question interactions ---
    const userQuizQuestions = await db.userQuizQuestion.findMany({
      where: { userId },
      select: {
        id: true,
        questionId: true,
        liked: true,
        disliked: true,
        saved: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      lessonProgress,
      quizResults,
      userQuizQuestions,
    });
  } catch (err) {
    console.error("❌ Error fetching sync data:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// export async function GET(req: NextRequest) {
//     const auth = requireAuth(req);
//     if (auth instanceof NextResponse) return auth;
//     const { userId } = auth;

//     try {
//         // Fetch quiz results
//         const quizResults = await db.quizResult.findMany({
//         where: { userId },
//             select: {
//                 id: true,
//                 quizId: true,
//                 answers: true,
//                 score: true,
//                 completed: true,
//                 attemptCount: true,
//                 updatedAt: true,
//             },
//         });

//         // Fetch user quiz question interactions
//         const userQuizQuestions = await db.userQuizQuestion.findMany({
//         where: { userId },
//             select: {
//                 id: true,
//                 questionId: true,
//                 liked: true,
//                 disliked: true,
//                 saved: true,
//                 updatedAt: true,
//             },
//         });

//         return NextResponse.json({
//             quizResults,
//             userQuizQuestions,
//         });
//     } catch (err) {
//         console.error("❌ Error fetching sync data:", err);
//         return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//     }
// }
