import { db } from "@/lib/db"
import { redirect } from "next/navigation"

import { auth } from "@/lib/getAuth"
import { QuizSection } from "./_components/quiz-section"

const FullTestPage = async () => {
  const FULL_TEST_QUIZ_ID = "d1b42b93-b580-4bf7-b0af-b70efde22c69" // Hardcoded ID for full test
  const { userId } = await auth()

  const quiz = await db.quiz.findUnique({
    where: { id: FULL_TEST_QUIZ_ID },
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

    // Hardcoded array of available quiz IDs for full tests
    const availableQuizIds = ["d1b42b93-b580-4bf7-b0af-b70efde22c69"]

    // Get quiz details and results for each available quiz
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
      sectionTitle="Full Practice Test"
      sectionType="full"
    />
  )
}

export default FullTestPage


// import { db } from "@/lib/db"
// import { redirect } from "next/navigation"

// import { auth } from "@/lib/getAuth"
// import { QuizSection } from "./_components/quiz-section"

// const WritingSectionPage = async () => {
//   const WRITING_QUIZ_ID = "d1b42b93-b580-4bf7-b0af-b70efde22c69" // Hardcoded ID for writing section
//   const { userId } = await auth()

//   const quiz = await db.quiz.findUnique({
//     where: { id: WRITING_QUIZ_ID },
//     include: {
//       questions: {
//         orderBy: { position: "asc" },
//       },
//     },
//   })

//   if (!quiz) {
//     return redirect("/")
//   }

//   let existingResult = null
//   if (userId) {
//     existingResult = await db.quizResult.findUnique({
//       where: {
//         userId_quizId: {
//           userId,
//           quizId: quiz.id,
//         },
//       },
//     })
//   }

//   let availableQuizzes = ["d1b42b93-b580-4bf7-b0af-b70efde22c69"]
//   // if (userId) {
//   //   availableQuizzes = await db.quiz.findMany({
//   //     where: {
//   //       isPublished: true,
//   //     },
//   //     select: {
//   //       id: true,
//   //       title: true,
//   //       description: true,
//   //       totalQuestions: true,
//   //     },
//   //   })
//   // }

//   return (
//     <QuizSection
//       quiz={quiz}
//       userId={userId}
//       existingResult={existingResult}
//       availableQuizzes={availableQuizzes}
//       sectionTitle="Writing Section"
//       sectionType="writing"
//     />
//   )
// }

// export default WritingSectionPage




















// import { db } from "@/lib/db"
// import { redirect } from "next/navigation"
// import { ComprehensiveTest } from "./_components/comprehensive-test"
// import { auth } from "@/lib/getAuth";


// const TestPage = async () => {
//   const courseId = process.env.COURSE_ID || "";
//   const {userId} = await auth();

//   const course = await db.course.findUnique({
//     where: { id: courseId },
//     include: {
//       chapters: {
//         where: { isPublished: true },
//         include: {
//           quizzes: {
//             where: { isPublished: true },
//             include: {
//               questions: {
//                 orderBy: { position: "asc" },
//               },
//             },
//           },
//         },
//       },
//     },
//   })

//   if (!course) {
//     return redirect("/")
//   }

//   // Collect all questions from all quizzes
//   const allQuestions = course.chapters
//     .flatMap((chapter) => chapter.quizzes)
//     .flatMap((quiz) => quiz.questions)
//     .map((question) => {
//       const options = Array.isArray(question.options)
//         ? (question.options as string[]).filter((option) => typeof option === "string")
//         : []

//       const answers = Array.isArray(question.answers)
//         ? (question.answers as string[]).filter((answer) => typeof answer === "string")
//         : []

//       return {
//         ...question,
//         options,
//         answers,
//       }
//     })
//     .sort(() => Math.random() - 0.5) // Randomize questions

//   // Check for existing test result
//   const existingResult = null

//   return <ComprehensiveTest course={course} questions={allQuestions} userId={userId || 'guest'} existingResult={existingResult} />
// }

// export default TestPage
