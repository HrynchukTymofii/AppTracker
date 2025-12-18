import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import CoursePage from "./_components/course-page"
import { auth } from "@/lib/getAuth"

const CourseIdPage = async () => {
  const courseId = process.env.COURSE_ID
  const { userId } = await auth()

  let course

  course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            include: {
              progress: userId ? { where: { userId } } : true,
            },
          },
          quizzes: {
            where: { isPublished: true },
            include: {
              results: userId ? { where: { userId } } : true,
            },
          },
        },
      },
    },
  });


  if (!course) {
    return redirect("/course")
  }

  let isEnrolled = false
  if (userId) {
    const enrollment = await db.courseSubscription.findFirst({
      where: { userId, courseId },
    })
    isEnrolled = !!enrollment
  }

  // 🔑 if enrolled, compute next lesson/quiz on the server
  if (isEnrolled) {
    let nextContent: { id: string; type: "lesson" | "quiz" } | null = null

    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        const isCompleted =
          lesson.progress!  && lesson.progress.length > 0 && lesson.progress[0].completed
        if (!isCompleted) {
          nextContent = { id: lesson.id, type: "lesson" }
          break
        }
      }
      if (nextContent) break

      for (const quiz of chapter.quizzes) {
        const isPassed = quiz.results && quiz.results.length > 0 && quiz.results[0].completed
        if (!isPassed) {
          nextContent = { id: quiz.id, type: "quiz" }
          break
        }
      }
      if (nextContent) break
    }

    if (nextContent) {
      return redirect(`/course/${course.id}/${nextContent.type}s/${nextContent.id}`)
    } else {
      return redirect(`/course/${course.id}/completed`)
    }
  }

  // 🔓 If not enrolled, show landing page
  return <CoursePage course={course} isEnrolled={isEnrolled} userId={userId} />
}

export default CourseIdPage
