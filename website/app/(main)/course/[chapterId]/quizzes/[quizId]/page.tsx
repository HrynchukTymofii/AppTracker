import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { EnhancedQuiz } from "./_components/enhanced-quiz";
import { auth } from "@/lib/getAuth";


const QuizPage = async ({ params }: { params: Promise<{ chapterId: string; quizId: string }> }) => {
  const { chapterId, quizId } = await params
  const courseId = process.env.COURSE_ID || "";
  const user = await auth()
  const userId = user.userId

  if (!userId)return

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      chapter: {
        include: {
          course: true,
        },
      },
    },
  })

  const questions = await db.quizQuestion.findMany({
    where: { quizId: quizId },
    orderBy: { position: "asc" },
  })

  // Check for existing result
  const existingResult = await db.quizResult.findUnique({
    where: {
      userId_quizId: {
        userId,
        quizId,
      },
    },
  })

  if (!quiz) {
    return redirect(`/course`)
  }

  const formattedQuestions = questions.map((question) => {
    const options = Array.isArray(question.options)
      ? (question.options as string[]).filter((option) => typeof option === "string")
      : []

    const answers = Array.isArray(question.answers)
      ? (question.answers as string[]).filter((answer) => typeof answer === "string")
      : []

    return {
      ...question,
      options,
      answers,
    }
  })

  return (
    <EnhancedQuiz
      quiz={quiz}
      questions={formattedQuestions}
      courseId={courseId}
      chapterId={chapterId}
      userId={userId}
      existingResult={existingResult}
    />
  )
}

export default QuizPage

// import { db } from "@/lib/db";
// import { redirect } from "next/navigation";
// import toast from "react-hot-toast";
// import { Quiz } from "./_components/quiz";

// const LessonPage = async ({ params }: { params: Promise<{ chapterId: string; quizId: string }> }) => {
//   const { chapterId, quizId } = await params;

//   const quiz = await db.quiz.findUnique({
//     where: { id: quizId },
//   });

//   const questions = await db.quizQuestion.findMany({
//     where: { quizId: quizId },
//     orderBy: { position: "asc" },
//   });

//   if (!quiz) {
//     toast.error("Something went wrong!");
//     return redirect(`/courses`);
//   }

//   const formattedQuestions = questions.map((question) => {
//     // Ensure options are an array of strings
//     const options = Array.isArray(question.options)
//         ? (question.options as string[]).filter((option) => typeof option === "string")
//         : [];

//     // Ensure answers are an array of strings
//     const answers = Array.isArray(question.answers)
//         ? (question.answers as string[]).filter((answer) => typeof answer === "string")
//         : [];

//     return {
//         ...question,
//         options,  // Now correctly typed as string[]
//         answers,  // Now correctly typed as string[]
//     };
// });

//   return <Quiz quiz={quiz} questions={formattedQuestions} />;
// };

// export default LessonPage;