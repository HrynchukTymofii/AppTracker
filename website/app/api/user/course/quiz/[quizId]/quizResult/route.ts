import { db } from "@/lib/db";
import { requireAuth } from "@/lib/expo-auth";
import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
//   try {
//     const { quizId } = await params;

//     if (!quizId) {
//       return new NextResponse("Missing required fields", { status: 400 });
//     }

//     const quiz = await db.quiz.findUnique({
//       where: { id: quizId },
//       include: {
//         questions: {
//           orderBy: { position: "asc" },
//         },
//       },
//     });

//     if (!quiz) {
//       return new NextResponse("Quiz not found", { status: 404 });
//     }

//     return NextResponse.json({ success: true, data: quiz });
//   } catch (error) {
//     console.error("Error fetching quiz:", error);
//     return new NextResponse("Internal Error", { status: 500 });
//   }
// }

export async function GET(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { quizId } = await params;

  const quiz = await db.quiz.findUnique({
    where: {
      id: quizId,
      isPublished: true,
    },
    include: {
      questions: {
        orderBy: { position: "asc" },
      },
      chapter: true,
      results: {
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const latestResult = quiz.results?.[0];
  const parsedAnswers: Record<string, string[]> =
    latestResult?.answers && typeof latestResult.answers === "object" && !Array.isArray(latestResult.answers)
      ? (latestResult.answers as Record<string, string[]>)
      : {};

  const questions = quiz.questions.map((question) => {
    const options = Array.isArray(question.options)
      ? question.options.filter((option) => typeof option === "string")
      : [];

    const answers = Array.isArray(question.answers)
      ? question.answers.filter((answer) => typeof answer === "string")
      : [];

    return {
      id: question.id,
      question: question.question,       
      questionType: question.questionType ?? null,
      questionImageUrl: question.questionImageUrl ?? null,
      imageHeight: question.imageHeight ?? 200,
      options,
      answers,
      hint: question.hint ?? null,
      points: question.points ?? 5,
      position: question.position,
      hintImageUrl: question.hintImageUrl ?? null,
      note: question.note ?? null,
    };
  });


  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      chapterTitle: quiz.chapter.title,
      questions,
    },
    latestResult: latestResult
      ? {
          score: latestResult.score,
          answers: parsedAnswers,
        }
      : null,
  });
}



export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    const { userId } = await req.json();
  
    if (!userId || !quizId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
  
      const quizResult = await db.quizResult.findFirst({
        where: { userId, quizId: quizId },
        orderBy: { updatedAt: "desc" },
      });
  
      if (!quizResult) {
        return new NextResponse("No quiz result found", { status: 404 });
      }
  
      return NextResponse.json(quizResult);
    } catch (error) {
      console.error("Error fetching quiz result:", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
}
  