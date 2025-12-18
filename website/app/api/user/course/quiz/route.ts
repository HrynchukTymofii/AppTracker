import { updateUserNeedSync, updateUserPoints } from "@/app/actions/user-actions";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/expo-auth";
import { auth } from "@/lib/getAuth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let platform: 'web' | "mobile" = 'web';

  const session = await auth()
  if (session?.user?.userId) {
    userId = session.user.userId
  }

  if (!userId) {
    const authResult = requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    userId = authResult.userId
    platform = 'mobile'
  }

  const { quizId, answers } = await req.json();

  if (!userId || !quizId || !answers) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  try {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    let totalScore = 0;

    const questionResults = quiz.questions.map((question) => {
      const userAnswers = answers[question.id] || [];
      const correctAnswers = question.answers as string[];
      const isCorrect =
        correctAnswers.every((a) => userAnswers.includes(a)) &&
        userAnswers.length === correctAnswers.length;

      if (isCorrect) {
        totalScore += question.points;
      }

      return { questionId: question.id, isCorrect };
    });

    const quizResult = await db.quizResult.upsert({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
      update: {
        score: totalScore,
        answers,
        completed: totalScore !== 0,
        attemptCount: { increment: 1 },
      },
      create: {
        userId,
        quizId,
        score: totalScore,
        answers: answers,
        completed: totalScore !== 0,
        attemptCount: 1,
      },
    });

    const updateResult = await updateUserPoints(userId, totalScore, platform);

    if (!updateResult.success) {
      console.error("Failed to update user points:", updateResult.error);
    }

    return NextResponse.json({ totalScore, questionResults, quizResult });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  let userId: string | null = null;
  let platform: 'web' | "mobile" = 'web';

  const session = await auth()
  if (session?.user?.userId) {
    userId = session.user.userId
  }

  if (!userId) {
    const authResult = requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    userId = authResult.userId
    platform = 'mobile'
  }

  const { quizId, answers } = await req.json();

  if (!userId || !quizId || !answers) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  try {
    if (quizId === "all") {
      const quizResults = await db.quizResult.findMany({
        where: { userId },
        include: {
          quiz: {
            include: { questions: true },
          },
        },
      });

      const updatedResults = [];
      let totalPointsToAdd = 0;

      for (const result of quizResults) {
        const updatedAnswers = { ...(result.answers as Record<string, string[]>) };
        let changed = false;

        const quizQuestions = result.quiz.questions;

        for (const question of quizQuestions) {
          const submittedAnswer = answers[question.id];
          const correctAnswers = question.answers as string[];

          // Remove wrong answers if any (optimize)
          const cleanedAnswer = submittedAnswer
            ? (submittedAnswer as string[]).filter((a: string) => correctAnswers.includes(a))
            : undefined;


          if (!cleanedAnswer || cleanedAnswer.length === 0) continue;

          const currentAnswer = updatedAnswers[question.id] || [];

          const isSame = JSON.stringify(currentAnswer) === JSON.stringify(cleanedAnswer);

          if (!isSame) {
            updatedAnswers[question.id] = cleanedAnswer;
            changed = true;
          }
        }

        if (changed) {
          // Recalculate score using updatedAnswers
          let newScore = 0;

          for (const question of quizQuestions) {
            const userAnswer = updatedAnswers[question.id] || [];
            const correctAnswers = question.answers as string[];

            const isCorrect =
              correctAnswers.every((a) => userAnswer.includes(a)) &&
              userAnswer.length === correctAnswers.length;

            if (isCorrect) {
              newScore += question.points;
            }
          }

          const pointsToAdd = Math.max(0, newScore - result.score);
          totalPointsToAdd += pointsToAdd;

          const updatedResult = await db.quizResult.update({
            where: {
              userId_quizId: {
                userId,
                quizId: result.quizId,
              },
            },
            data: {
              answers: updatedAnswers,
              score: newScore,
              completed: newScore > 0,
              attemptCount: { increment: 1 },
              updatedAt: new Date(),
            },
          });

          updatedResults.push(updatedResult);
        }
      }

      if (totalPointsToAdd > 0) {
        const updateResult = await updateUserPoints(userId, totalPointsToAdd, platform);
        if (!updateResult.success) {
          console.error("Failed to update user points:", updateResult.error);
        }
      }

      return NextResponse.json({ updatedResults });

    } else {
      // Original logic for a single quiz
      const quiz = await db.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true },
      });

      if (!quiz) {
        return new NextResponse("Quiz not found", { status: 404 });
      }

      const previousQuizResult = await db.quizResult.findUnique({
        where: { userId_quizId: { userId, quizId } },
        select: { score: true },
      });

      let totalScore = 0;

      const questionResults = quiz.questions.map((question) => {
        const userAnswers = answers[question.id] || [];
        const correctAnswers = question.answers as string[];
        const isCorrect =
          correctAnswers.every((a) => userAnswers.includes(a)) &&
          userAnswers.length === correctAnswers.length;

        if (isCorrect) {
          totalScore += question.points;
        }

        return { questionId: question.id, isCorrect };
      });

      const previousScore = previousQuizResult?.score ?? 0;
      const pointsToAdd = Math.max(0, totalScore - previousScore);

      const quizResult = await db.quizResult.update({
        where: { userId_quizId: { userId, quizId } },
        data: {
          score: totalScore,
          answers: answers,
          completed: totalScore > 0,
          attemptCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      const updateResult = await updateUserPoints(userId, pointsToAdd, platform);
      if (!updateResult.success) {
        console.error("Failed to update user points:", updateResult.error);
      }

      return NextResponse.json({ totalScore, questionResults, quizResult });
    }
  } catch (error) {
    console.error("Error retrying quiz:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  let userId: string | null = null;

  const session = await auth()
  if (session?.user?.userId) {
    userId = session.user.userId
  }

  if (!userId) {
    const authResult = requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    userId = authResult.userId
  }
  const { quizId } = await req.json()

  if (!userId || !quizId) {
    return new NextResponse("Missing userId or quizId", { status: 400 })
  }

  try {
    await db.quizResult.deleteMany({
      where: {
        userId,
        quizId,
      },
    })

    await updateUserNeedSync(userId);

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting quiz result:", error)
    return new NextResponse("Failed to delete quiz result", { status: 500 })
  }
}
