"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Trophy,
  Target,
  RotateCcw,
  ArrowRight,
} from "lucide-react"
import { EnhancedQuizQuestion } from "./enhanced-quiz-question"
import { Loader } from "@/components/loader"
import toast from "react-hot-toast"
import axios from "axios"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface EnhancedQuizProps {
  quiz: any
  questions: Array<{
    id: string
    position: number
    question: string
    questionType: string | null
    questionImageUrl?: string | null
    options: string[]
    answers: string[]
    points: number
    note: string | null
  }>
  courseId: string
  chapterId: string
  userId: string
  existingResult: any
}

export const EnhancedQuiz = ({ quiz, questions, courseId, userId, existingResult }: EnhancedQuizProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime] = useState(Date.now())

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime])

  // Load existing answers if available
  useEffect(() => {
    if (existingResult && existingResult.answers) {
      setSelectedAnswers(existingResult.answers as Record<string, string[]>)
      if (existingResult.completed) {
        setIsSubmitted(true)
        calculateAndShowResults(existingResult.answers as Record<string, string[]>)
      }
    }
  }, [existingResult])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswerSelect = (questionId: string, answers: string[]) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answers,
    }))
  }

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const calculateAndShowResults = (answers: Record<string, string[]>) => {
    let earnedPoints = 0
    const totalMaxPoints = questions.reduce((sum, q) => sum + q.points, 0)
    const questionResults: Record<string, boolean[]> = {}

    questions.forEach((question) => {
      const correctAnswers = question.answers
      const userAnswers = answers[question.id] || []

      // Different scoring logic based on question type
      let isCorrect = false

      if (question.questionType === "open_ended") {
        // For open-ended questions, we'll give full points if they provided an answer
        // In a real system, this would need manual grading or AI evaluation
        isCorrect = userAnswers.length > 0 && userAnswers[0].trim().length > 0
      } else {
        // For other question types, exact match required
        isCorrect = correctAnswers.every((a) => userAnswers.includes(a)) && userAnswers.length === correctAnswers.length
      }

      questionResults[question.id] = question.options.map(
        (option) => correctAnswers.includes(option) === userAnswers.includes(option),
      )

      if (isCorrect) {
        earnedPoints += question.points
      }
    })

    const percentage = Math.round((earnedPoints / totalMaxPoints) * 100)
    const passed = percentage >= 70 // 70% passing grade

    setResults({
      earnedPoints,
      totalMaxPoints,
      percentage,
      passed,
      questionResults,
      timeSpent,
      correctAnswers: questions.filter((q) => {
        const userAnswers = answers[q.id] || []
        if (q.questionType === "open_ended") {
          return userAnswers.length > 0 && userAnswers[0].trim().length > 0
        }
        return q.answers.every((a) => userAnswers.includes(a)) && userAnswers.length === q.answers.length
      }).length,
      totalQuestions: questions.length,
    })

    setShowResults(true)
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = questions.filter((q) => {
      const answers = selectedAnswers[q.id]
      return !answers || answers.length === 0 || (answers.length === 1 && answers[0].trim() === "")
    })

    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all questions. ${unansweredQuestions.length} questions remaining.`)
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post("/api/user/course/quiz", {
        userId,
        quizId: quiz.id,
        answers: selectedAnswers,
        timeSpent,
      })

      if (response.status === 200) {
        setIsSubmitted(true)
        calculateAndShowResults(selectedAnswers)
        toast.success("Quiz submitted successfully!")
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast.error("Error submitting quiz. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async () => {
    setIsLoading(true)

    try {
      await axios.delete(`/api/quiz/${quiz.id}/result`, {
        data: { userId },
      })

      setSelectedAnswers({})
      setIsSubmitted(false)
      setShowResults(false)
      setResults(null)
      setCurrentQuestionIndex(0)
      toast.success("Quiz reset! You can try again.")
    } catch (error) {
      console.error("Error resetting quiz:", error)
      toast.error("Error resetting quiz. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getQuestionStatus = (questionIndex: number) => {
    const question = questions[questionIndex]
    const hasAnswers = selectedAnswers[question.id] && selectedAnswers[question.id].length > 0

    if (isSubmitted && results) {
      let isCorrect = false
      if (question.questionType === "open_ended") {
        isCorrect = hasAnswers && selectedAnswers[question.id][0].trim().length > 0
      } else {
        isCorrect =
          question.answers.every((a) => selectedAnswers[question.id]?.includes(a)) &&
          selectedAnswers[question.id]?.length === question.answers.length
      }
      return isCorrect ? "correct" : "incorrect"
    }

    return hasAnswers ? "answered" : "unanswered"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader text="Processing your quiz..." />
      </div>
    )
  }

  if (showResults && results) {
    return (
      <QuizResults
        results={results}
        quiz={quiz}
        questions={questions}
        selectedAnswers={selectedAnswers}
        onRetry={handleRetry}
        courseId={courseId}
      />
    )
  }

  return (
    <div className="max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-white py-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-900">{quiz.title}</CardTitle>
              {quiz.description && <p className="text-slate-600 mt-2 text-sm md:text-base">{quiz.description}</p>}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-sm">{formatTime(timeSpent)}</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {currentQuestionIndex + 1} of {questions.length}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-4" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation Sidebar */}
        <Card className="lg:col-span-1 shadow-lg border-0 bg-white py-6">
          <CardHeader >
            <CardTitle className="text-lg font-semibold text-slate-900">Questions</CardTitle>
          </CardHeader>
          <CardContent >
            <div className="space-y-2 space-x-2">
              {questions.map((question, index) => {
                const status = getQuestionStatus(index)
                return (
                  <Button
                    key={index}
                    variant={currentQuestionIndex === index ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-8 justify-start border border-slate-200 text-xs lg:text-sm",
                      status === "correct" && "bg-green-100 text-green-700 hover:bg-green-200",
                      status === "incorrect" && "bg-red-100 text-red-700 hover:bg-red-200",
                      status === "answered" && !isSubmitted && "bg-blue-100 text-blue-700 hover:bg-blue-200",
                    )}
                    onClick={() => navigateToQuestion(index)}
                  >
                    <span className="mr-1 lg:mr-2">{index + 1}</span>
                    {/* <span className="hidden lg:inline">
                      {question.questionType === "multiple_choice" && "MC"}
                      {question.questionType === "single_choice" && "SC"}
                      {question.questionType === "true_false" && "TF"}
                      {question.questionType === "open_ended" && "OE"}
                    </span> */}
                    {status === "correct" && <CheckCircle className="h-3 w-3 ml-auto" />}
                    {status === "incorrect" && <AlertCircle className="h-3 w-3 ml-auto" />}
                    {status === "answered" && !isSubmitted && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EnhancedQuizQuestion
                question={currentQuestion}
                selectedAnswers={selectedAnswers[currentQuestion.id] || []}
                onAnswerSelect={(answers) => handleAnswerSelect(currentQuestion.id, answers)}
                isSubmitted={isSubmitted}
                results={isSubmitted ? results?.questionResults[currentQuestion.id] : null}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-3 w-full sm:w-auto">
              {currentQuestionIndex === questions.length - 1 && !isSubmitted ? (
                <Button
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2 w-full sm:w-auto"
                >
                  <Target className="h-4 w-4" />
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const QuizResults = ({ results, quiz, onRetry }: any) => {
  const router = useRouter()

  const getPerformanceMessage = () => {
    if (results.percentage >= 90) {
      return {
        title: "Outstanding Performance! 🎉",
        message: "You've mastered this topic! Your understanding is excellent.",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      }
    } else if (results.percentage >= 80) {
      return {
        title: "Great Job! 👏",
        message: "You have a solid understanding. Review the missed questions to improve further.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      }
    } else if (results.percentage >= 70) {
      return {
        title: "Good Effort! 📚",
        message: "You passed! Consider reviewing the material to strengthen your knowledge.",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      }
    } else {
      return {
        title: "Keep Learning! 💪",
        message: "Don't give up! Review the material and try again. Every attempt makes you stronger.",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      }
    }
  }

  const performance = getPerformanceMessage()

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Results Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="shadow-xl border-0 bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Quiz Complete!</h1>
                <p className="text-blue-100">{quiz.title}</p>
              </div>
              <Trophy className="h-12 w-12 md:h-16 md:w-16 text-yellow-300" />
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-slate-900">{results.percentage}%</div>
                <div className="text-slate-600 text-sm">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-slate-900">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <div className="text-slate-600 text-sm">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-slate-900">
                  {results.earnedPoints}/{results.totalMaxPoints}
                </div>
                <div className="text-slate-600 text-sm">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-slate-900">
                  {Math.floor(results.timeSpent / 60)}m
                </div>
                <div className="text-slate-600 text-sm">Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className={cn("shadow-lg border-2", performance.borderColor, performance.bgColor)}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className={cn("text-xl md:text-2xl font-bold", performance.color)}>{performance.title}</h2>
              <p className="text-slate-700 text-base md:text-lg">{performance.message}</p>
              {results.passed ? (
                <Badge className="bg-green-600 text-white px-4 py-2 text-base md:text-lg">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Passed
                </Badge>
              ) : (
                <Badge variant="destructive" className="px-4 py-2 text-base md:text-lg">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Not Passed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!results.passed && (
            <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/course`)} className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Continue Course
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
