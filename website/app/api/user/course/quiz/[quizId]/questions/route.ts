import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;

  try {
    const questions = await db.quizQuestion.findMany({
      where: { quizId },
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
        quizId: true,
        updatedAt: true
      },
    });

    return NextResponse.json(questions);
  } catch (err) {
    console.error(`❌ Error fetching questions for quiz ${quizId}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch quiz questions" },
      { status: 500 }
    );
  }
}
