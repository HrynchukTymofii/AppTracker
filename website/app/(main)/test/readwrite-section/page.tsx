import { db } from "@/lib/db"
import { redirect } from "next/navigation"

import { auth } from "@/lib/getAuth"
import { QuizSection } from "../_components/quiz-section"

const ReadWriteSectionPage = async () => {
  const READWRITE_QUIZ_ID = "d1b42b93-b580-4bf7-b0af-b70efde22c69" // Hardcoded ID for read/write section
  const { userId } = await auth()

  const quiz = await db.quiz.findUnique({
    where: { id: READWRITE_QUIZ_ID },
    include: {
      questions: {
        orderBy: { position: "asc" },
      },
    },
  })

  if (!quiz) {
    return redirect("/")
  }

  let existingResult = null
  let availableQuizzes: any[] = []

  if (userId) {
    existingResult = await db.quizResult.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId: quiz.id,
        },
      },
    })

    // Hardcoded array of available quiz IDs for read/write section
    const availableQuizIds = ["readwrite-section-quiz-id", "readwrite-section-quiz-id-2", "readwrite-section-quiz-id-3"]

    const quizPromises = availableQuizIds.map(async (quizId) => {
      const quizData = await db.quiz.findUnique({
        where: { id: quizId },
        select: {
          id: true,
          title: true,
          description: true,
          totalQuestions: true,
          maxScore: true,
        },
      })

      const result = await db.quizResult.findUnique({
        where: {
          userId_quizId: {
            userId,
            quizId,
          },
        },
        select: {
          score: true,
          completed: true,
        },
      })

      return {
        ...quizData,
        result,
      }
    })

    availableQuizzes = (await Promise.all(quizPromises)).filter(Boolean)
  }

  return (
    <QuizSection
      quiz={quiz}
      userId={userId}
      existingResult={existingResult}
      availableQuizzes={availableQuizzes}
      sectionTitle="Reading & Writing Section"
      sectionType="readwrite"
    />
  )
}

export default ReadWriteSectionPage
