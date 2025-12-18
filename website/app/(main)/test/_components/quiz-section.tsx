"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  BookOpen,
  Target,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw,
  ArrowRight,
  User,
  LogIn,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Loader } from "@/components/loader"
import toast from "react-hot-toast"
import axios from "axios"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ReadOnlyEditor } from "@/components/tiptap-templates/simple/readonly-editor"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface QuizSectionProps {
  quiz: any
  userId: string | null
  existingResult: any
  availableQuizzes: any[]
  sectionTitle: string
  sectionType: string
}

export const QuizSection = ({
  quiz: initialQuiz,
  userId,
  existingResult,
  availableQuizzes,
  sectionTitle,
  sectionType,
}: QuizSectionProps) => {
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuiz.id)
  const [currentQuiz, setCurrentQuiz] = useState(initialQuiz)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [timeLimit] = useState(currentQuiz.questions.length * 90) // 90 seconds per question
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const router = useRouter()

  // Timer effect
  useEffect(() => {
    if (!hasStarted || isSubmitted) return

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setTimeSpent(elapsed)

      if (elapsed >= timeLimit) {
        handleAutoSubmit()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [hasStarted, startTime, timeLimit, isSubmitted])

  // Load existing result if available
  useEffect(() => {
    if (existingResult && existingResult.answers) {
      setSelectedAnswers(existingResult.answers as Record<string, string[]>)
      if (existingResult.completed) {
        setIsSubmitted(true)
        calculateAndShowResults(existingResult.answers as Record<string, string[]>)
      }
    }
  }, [existingResult])

  const handleQuizChange = async (quizId: string) => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await axios.get(`/api/quiz/${quizId}`)
      setCurrentQuiz(response.data)
      setSelectedQuizId(quizId)
      // Reset quiz state
      setHasStarted(false)
      setCurrentQuestionIndex(0)
      setSelectedAnswers({})
      setIsSubmitted(false)
      setShowResults(false)
      setResults(null)
      setTimeSpent(0)
    } catch (error) {
      toast.error("Failed to load quiz")
    } finally {
      setIsLoading(false)
    }
  }

  const startTest = () => {
    setHasStarted(true)
    setStartTime(Date.now())
    toast.success("Test started! Good luck!")
  }

  const handleAnswerSelect = (option: string) => {
    const questionId = currentQuiz.questions[currentQuestionIndex].id
    setSelectedAnswers((prev) => {
      const prevAnswers = prev[questionId] || []
      if (prevAnswers.includes(option)) {
        return { ...prev, [questionId]: prevAnswers.filter((ans) => ans !== option) }
      } else {
        return { ...prev, [questionId]: [...prevAnswers, option] }
      }
    })
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
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
    const totalMaxPoints = currentQuiz.questions.reduce((sum: number, q: any) => sum + q.points, 0)
    const questionResults: any[] = []

    currentQuiz.questions.forEach((question: any) => {
      const correctAnswers = Array.isArray(question.answers) ? question.answers : []
      const userAnswers = answers[question.id] || []
      const isCorrect =
        correctAnswers.every((a: string) => userAnswers.includes(a)) && userAnswers.length === correctAnswers.length

      if (isCorrect) {
        earnedPoints += question.points
      }

      questionResults.push({
        question,
        userAnswers,
        correctAnswers,
        isCorrect,
        points: isCorrect ? question.points : 0,
      })
    })

    const percentage = Math.round((earnedPoints / totalMaxPoints) * 100)
    const passed = percentage >= 75

    setResults({
      earnedPoints,
      totalMaxPoints,
      percentage,
      passed,
      timeSpent,
      correctAnswers: questionResults.filter((r) => r.isCorrect).length,
      totalQuestions: currentQuiz.questions.length,
      questionResults,
    })

    setShowResults(true)

    // Show login prompt for guests after completing test
    if (!userId) {
      setShowLoginPrompt(true)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      if (userId) {
        await axios.post("/api/user/course/quiz", {
          userId,
          quizId: currentQuiz.id,
          answers: selectedAnswers,
          timeSpent,
        })
      }

      setIsSubmitted(true)
      calculateAndShowResults(selectedAnswers)
      toast.success("Test submitted successfully!")
    } catch (error) {
      console.error("Error submitting test:", error)
      toast.error("Error submitting test. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoSubmit = () => {
    toast.error("Time's up! Test submitted automatically.")
    handleSubmit()
  }

  const handleRetry = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      await axios.delete(`/api/quiz/${currentQuiz.id}/result`, {
        data: { userId },
      })

      setSelectedAnswers({})
      setIsSubmitted(false)
      setShowResults(false)
      setResults(null)
      setCurrentQuestionIndex(0)
      setHasStarted(false)
      setTimeSpent(0)
      toast.success("Test reset! You can try again.")
    } catch (error) {
      console.error("Error resetting test:", error)
      toast.error("Error resetting test. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const timeRemaining = Math.max(0, timeLimit - timeSpent)
  const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader text="Loading quiz..." />
      </div>
    )
  }

  if (showResults && results) {
    return (
      <TestResults
        results={results}
        sectionTitle={sectionTitle}
        onRetry={handleRetry}
        showLoginPrompt={showLoginPrompt}
        userId={userId}
      />
    )
  }

  // Pre-test screen
  if (!hasStarted && !existingResult?.completed) {
    return (
      <div className="max-w-4xl w-full mx-auto p-4 md:p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-xl border-0 bg-white">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 md:p-6 rounded-t-lg">
              <div className="text-center">
                <Trophy className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-yellow-300" />
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{sectionTitle}</h1>
                <p className="text-purple-100">Practice Test</p>
              </div>
            </div>

            <CardContent className="p-4 md:p-8 space-y-6">
              {/* Quiz Selection for Logged-in Users */}
              {userId && availableQuizzes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Practice Tests:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableQuizzes.map((quizData) => {
                      const isSelected = selectedQuizId === quizData.id
                      const isCompleted = quizData.result?.completed || false
                      const score = quizData.result?.score || 0
                      const maxScore = quizData.maxScore || 100
                      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

                      return (
                        <Card
                          key={quizData.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50",
                          )}
                          onClick={() => handleQuizChange(quizData.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 mb-1">{quizData.title}</h4>
                                <p className="text-sm text-slate-600">{quizData.totalQuestions} questions</p>
                              </div>
                              {isCompleted && (
                                <Badge
                                  className={cn(
                                    "ml-2",
                                    percentage >= 75 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                                  )}
                                >
                                  {percentage}%
                                </Badge>
                              )}
                            </div>

                            {isCompleted && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">Progress:</span>
                                  <span className="font-medium">
                                    {score}/{maxScore} points
                                  </span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500">
                                    {percentage >= 75 ? "Passed" : "Failed"}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs bg-transparent"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRetakeQuiz(quizData.id)
                                    }}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Retake
                                  </Button>
                                </div>
                              </div>
                            )}

                            {!isCompleted && (
                              <div className="pt-2">
                                <Button variant={isSelected ? "default" : "outline"} size="sm" className="w-full">
                                  {isSelected ? "Selected" : "Select Test"}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <BookOpen className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold text-slate-900">{currentQuiz.questions.length}</div>
                  <div className="text-sm text-slate-600">Questions</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Clock className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-amber-600" />
                  <div className="font-semibold text-slate-900">{Math.floor(timeLimit / 60)} min</div>
                  <div className="text-sm text-slate-600">Time Limit</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Target className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-semibold text-slate-900">75%</div>
                  <div className="text-sm text-slate-600">Pass Score</div>
                </div>
              </div>

              {!userId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 mb-2">Guest Mode</h3>
                      <p className="text-blue-800 text-sm mb-3">
                        You're taking this test as a guest. After completion, you can login to access more free tests
                        and track your progress.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-900 mb-2">Test Instructions</h3>
                    <ul className="text-amber-800 text-sm space-y-1">
                      <li>• You have {Math.floor(timeLimit / 60)} minutes to complete all questions</li>
                      <li>• You need 75% or higher to pass</li>
                      <li>• You can navigate between questions freely</li>
                      <li>• Make sure to answer all questions before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button onClick={startTest} size="lg" className="bg-green-600 hover:bg-green-700 px-8">
                  <Play className="h-5 w-5 mr-2" />
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex]

  return (
    <div className="w-full max-w-7xl min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b shadow-sm  mt-4 rounded-lg">
        <div className=" mx-auto px-4 py-3">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-lg md:text-xl font-bold text-slate-900">{sectionTitle}</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs md:text-sm">
                {currentQuestionIndex + 1} / {currentQuiz.questions.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4" />
                <span className={cn("font-mono text-sm", timeRemaining < 300 && "text-red-600 font-bold")}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
          {timeRemaining < 300 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Less than 5 minutes remaining!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-7xl mx-auto py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Question Side */}
              <Card className="shadow-lg border-0 bg-white h-fit py-4 gap-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Question {currentQuestionIndex + 1}
                    </CardTitle>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      {currentQuestion.points} points
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <ReadOnlyEditor initialContent={currentQuestion.question} />
                  </div>

                  {/* Question Image */}
                  {currentQuestion.questionImageUrl && (
                    <div className="mt-4">
                      <Image
                        src={currentQuestion.questionImageUrl || "/placeholder.svg"}
                        alt="Question illustration"
                        width={400}
                        height={currentQuestion.imageHeight || 200}
                        className="rounded-lg border max-w-full h-auto"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Options Side */}
              <Card className="shadow-lg border-0 bg-white h-fit py-4 gap-2">
                <CardHeader >
                  <CardTitle className="text-lg font-semibold text-slate-900">Choose your answer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(currentQuestion.options) &&
                      currentQuestion.options.map((option: string, index: number) => {
                        const isSelected = selectedAnswers[currentQuestion.id]?.includes(option) || false

                        return (
                          <div
                            key={index}
                            className={cn(
                              "flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer text-sm",
                              isSelected ? "bg-blue-50 border-blue-300" : "bg-slate-50 border-slate-200",
                              "hover:bg-slate-100",
                            )}
                            onClick={() => handleAnswerSelect(option)}
                          >
                            <span className="flex-1 text-slate-700 leading-relaxed">{option}</span>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-lg shadow-sm">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 bg-transparent"
          >
            Previous
          </Button>

          <div className="flex gap-3">
            {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Submit Test
              </Button>
            ) : (
              <Button onClick={nextQuestion} className="flex items-center gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const handleRetakeQuiz = async (quizId: string) => {
    if (!userId) return

    setIsLoading(true)
    try {
      await axios.delete(`/api/quiz/${quizId}/result`, {
        data: { userId },
      })

      // Refresh the quiz data
      await handleQuizChange(quizId)
      toast.success("Quiz reset! You can start fresh.")
    } catch (error) {
      console.error("Error resetting quiz:", error)
      toast.error("Error resetting quiz. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
}

const TestResults = ({ results, sectionTitle, onRetry, showLoginPrompt, userId }: any) => {
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const getPerformanceMessage = () => {
    if (results.percentage >= 90) {
      return {
        title: "Exceptional! 🏆",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      }
    } else if (results.percentage >= 80) {
      return {
        title: "Excellent! 🌟",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      }
    } else if (results.percentage >= 75) {
      return {
        title: "Well Done! ✅",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      }
    } else {
      return {
        title: "Keep Studying! 📖",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      }
    }
  }

  const performance = getPerformanceMessage()

  return (
    <div className="min-h-screen max-w-4xl w-full bg-gray-50 p-4">
      <div className="w-full mx-auto space-y-6">
        {/* Header with compact stats */}
        <Card className="shadow-xl border-0 bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Test Complete!</h1>
              <p className="text-purple-100 text-lg">{sectionTitle}</p>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Compact Performance Summary */}
            <div className={cn("rounded-lg p-4 mb-6", performance.bgColor, performance.borderColor, "border")}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={cn("text-xl font-bold", performance.color)}>{performance.title}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span>{results.percentage}% Score</span>
                    <span>
                      {results.correctAnswers}/{results.totalQuestions} Correct
                    </span>
                    <span>{Math.floor(results.timeSpent / 60)}m Time</span>
                  </div>
                </div>
                <div className="text-right">
                  {results.passed ? (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Passed
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Login Prompt for Guests */}
            {showLoginPrompt && !userId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
                <LogIn className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-900 mb-2">Want More Free Tests?</h3>
                <p className="text-blue-800 mb-4">
                  You just need to login to access unlimited practice tests and track your progress!
                </p>
                <Button onClick={() => router.push("/auth/login")} className="bg-blue-600 hover:bg-blue-700">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login Now
                </Button>
              </div>
            )}

            {/* Detailed Results Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question Review</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      {/* <TableHead>Question</TableHead> */}
                      <TableHead className="w-20">Result</TableHead>
                      <TableHead className="w-20">Points</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.questionResults.map((result: any, index: number) => (
                      <>
                        {/* Main Row */}
                        <TableRow
                          key={result.question.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => toggleQuestion(result.question.id)}
                        >
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          {/* <TableCell className="max-w-xs">
                            <ReadOnlyEditor initialContent={result.question.question} />
                          </TableCell> */}
                          <TableCell>
                            {result.isCorrect ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Correct
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Wrong
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.points}/{result.question.points}
                          </TableCell>
                          <TableCell>
                            {expandedQuestions.has(result.question.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded Row */}
                        {expandedQuestions.has(result.question.id) && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-slate-50 p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Question Column */}
                                <div className="space-y-4">
                                  <h4 className="font-medium mb-3 text-slate-900">Question:</h4>
                                  <div className="prose prose-sm max-w-none bg-white p-4 rounded-lg border">
                                    <ReadOnlyEditor initialContent={result.question.question} />
                                  </div>
                                  {result.question.questionImageUrl && (
                                    <>
                                      <h4 className="font-medium mb-3 text-slate-900">Image:</h4>
                                      <Image
                                        src={result.question.questionImageUrl}
                                        alt="Question illustration"
                                        width={400}
                                        height={result.question.imageHeight || 200}
                                        className="rounded-lg border max-w-full h-auto"
                                      />
                                    </>
                                  )}
                                </div>

                                {/* Answers Column */}
                                <div className="space-y-4">
                                  <div>
                                    <h4
                                      className={`font-medium mb-3 ${
                                        result.isCorrect ? "text-green-600" : "text-red-600"
                                      }`}
                                    >
                                      {result.isCorrect ? "Your Answer Correct" : "Your Answer:"}
                                    </h4>
                                    <div className="space-y-2">
                                      {result.userAnswers.length > 0 ? (
                                        result.userAnswers.map((answer: string, i: number) => (
                                          <div
                                            key={i}
                                            className={`p-3 rounded-lg border ${
                                              result.isCorrect
                                                ? "bg-green-50 border-green-200"
                                                : "bg-red-50 border-red-200"
                                            }`}
                                          >
                                            <p
                                              className={`text-sm ${
                                                result.isCorrect ? "text-green-800" : "text-red-800"
                                              }`}
                                              style={{ whiteSpace: "normal" }}
                                            >
                                              {answer}
                                            </p>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                                          <span className="text-sm text-slate-500 italic">
                                            No answer selected
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {!result.isCorrect && (
                                    <div>
                                      <h4 className="font-medium mb-3 text-green-600">Correct Answer:</h4>
                                      <div className="space-y-2">
                                        {result.correctAnswers.map((answer: string, i: number) => (
                                          <div
                                            key={i}
                                            className="bg-green-50 border border-green-200 p-3 rounded-lg"
                                          >
                                            <span className="text-sm text-green-800 whitespace-normal">{answer}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>

                              {result.question.note && (
                                <div className="mt-6">
                                  <h4 className="font-medium mb-3 text-blue-600">Explanation:</h4>
                                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                    <div className="prose prose-sm max-w-none">
                                      <ReadOnlyEditor initialContent={result.question.note} />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>

                  
                </Table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              {!results.passed && userId && (
                <Button onClick={onRetry} size="lg" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Retake Test
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={() => router.push("/")} className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



// "use client"

// import { useState, useEffect } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Progress } from "@/components/ui/progress"
// import { Badge } from "@/components/ui/badge"
// import {
//   Clock,
//   BookOpen,
//   Target,
//   Trophy,
//   AlertTriangle,
//   CheckCircle,
//   Play,
//   RotateCcw,
//   ArrowRight,
//   User,
//   LogIn,
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react"
// import { Loader } from "@/components/loader"
// import toast from "react-hot-toast"
// import axios from "axios"
// import { useRouter } from "next/navigation"
// import { cn } from "@/lib/utils"
// import { ReadOnlyEditor } from "@/components/tiptap-templates/simple/readonly-editor"
// import Image from "next/image"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// interface QuizSectionProps {
//   quiz: any
//   userId: string | null
//   existingResult: any
//   availableQuizzes: any[]
//   sectionTitle: string
//   sectionType: string
// }

// export const QuizSection = ({
//   quiz: initialQuiz,
//   userId,
//   existingResult,
//   availableQuizzes,
//   sectionTitle,
//   sectionType,
// }: QuizSectionProps) => {
//   const [selectedQuizId, setSelectedQuizId] = useState(initialQuiz.id)
//   const [currentQuiz, setCurrentQuiz] = useState(initialQuiz)
//   const [hasStarted, setHasStarted] = useState(false)
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
//   const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
//   const [isSubmitted, setIsSubmitted] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [showResults, setShowResults] = useState(false)
//   const [results, setResults] = useState<any>(null)
//   const [timeSpent, setTimeSpent] = useState(0)
//   const [startTime, setStartTime] = useState<number>(0)
//   const [timeLimit] = useState(currentQuiz.questions.length * 90) // 90 seconds per question
//   const [showLoginPrompt, setShowLoginPrompt] = useState(false)

//   const router = useRouter()

//   // Timer effect
//   useEffect(() => {
//     if (!hasStarted || isSubmitted) return

//     const timer = setInterval(() => {
//       const elapsed = Math.floor((Date.now() - startTime) / 1000)
//       setTimeSpent(elapsed)

//       if (elapsed >= timeLimit) {
//         handleAutoSubmit()
//       }
//     }, 1000)

//     return () => clearInterval(timer)
//   }, [hasStarted, startTime, timeLimit, isSubmitted])

//   // Load existing result if available
//   useEffect(() => {
//     if (existingResult && existingResult.answers) {
//       setSelectedAnswers(existingResult.answers as Record<string, string[]>)
//       if (existingResult.completed) {
//         setIsSubmitted(true)
//         calculateAndShowResults(existingResult.answers as Record<string, string[]>)
//       }
//     }
//   }, [existingResult])

//   const handleQuizChange = async (quizId: string) => {
//     if (!userId) return

//     setIsLoading(true)
//     try {
//       const response = await axios.get(`/api/quiz/${quizId}`)
//       setCurrentQuiz(response.data)
//       setSelectedQuizId(quizId)
//       // Reset quiz state
//       setHasStarted(false)
//       setCurrentQuestionIndex(0)
//       setSelectedAnswers({})
//       setIsSubmitted(false)
//       setShowResults(false)
//       setResults(null)
//       setTimeSpent(0)
//     } catch (error) {
//       toast.error("Failed to load quiz")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const startTest = () => {
//     setHasStarted(true)
//     setStartTime(Date.now())
//     toast.success("Test started! Good luck!")
//   }

//   const handleAnswerSelect = (option: string) => {
//     const questionId = currentQuiz.questions[currentQuestionIndex].id
//     setSelectedAnswers((prev) => {
//       const prevAnswers = prev[questionId] || []
//       if (prevAnswers.includes(option)) {
//         return { ...prev, [questionId]: prevAnswers.filter((ans) => ans !== option) }
//       } else {
//         return { ...prev, [questionId]: [...prevAnswers, option] }
//       }
//     })
//   }

//   const nextQuestion = () => {
//     if (currentQuestionIndex < currentQuiz.questions.length - 1) {
//       setCurrentQuestionIndex(currentQuestionIndex + 1)
//     }
//   }

//   const previousQuestion = () => {
//     if (currentQuestionIndex > 0) {
//       setCurrentQuestionIndex(currentQuestionIndex - 1)
//     }
//   }

//   const calculateAndShowResults = (answers: Record<string, string[]>) => {
//     let earnedPoints = 0
//     const totalMaxPoints = currentQuiz.questions.reduce((sum: number, q: any) => sum + q.points, 0)
//     const questionResults: any[] = []

//     currentQuiz.questions.forEach((question: any) => {
//       const correctAnswers = Array.isArray(question.answers) ? question.answers : []
//       const userAnswers = answers[question.id] || []
//       const isCorrect =
//         correctAnswers.every((a: string) => userAnswers.includes(a)) && userAnswers.length === correctAnswers.length

//       if (isCorrect) {
//         earnedPoints += question.points
//       }

//       questionResults.push({
//         question,
//         userAnswers,
//         correctAnswers,
//         isCorrect,
//         points: isCorrect ? question.points : 0,
//       })
//     })

//     const percentage = Math.round((earnedPoints / totalMaxPoints) * 100)
//     const passed = percentage >= 75

//     setResults({
//       earnedPoints,
//       totalMaxPoints,
//       percentage,
//       passed,
//       timeSpent,
//       correctAnswers: questionResults.filter((r) => r.isCorrect).length,
//       totalQuestions: currentQuiz.questions.length,
//       questionResults,
//     })

//     setShowResults(true)

//     // Show login prompt for guests after completing test
//     if (!userId) {
//       setShowLoginPrompt(true)
//     }
//   }

//   const handleSubmit = async () => {
//     setIsLoading(true)

//     try {
//       if (userId) {
//         await axios.post(`/api/user/course/quiz`, {
//           userId,
//           quizId: currentQuiz.id,
//           answers: selectedAnswers,
//           timeSpent,
//         })
//       }

//       setIsSubmitted(true)
//       calculateAndShowResults(selectedAnswers)
//       toast.success("Test submitted successfully!")
//     } catch (error) {
//       console.error("Error submitting test:", error)
//       toast.error("Error submitting test. Please try again.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleAutoSubmit = () => {
//     toast.error("Time's up! Test submitted automatically.")
//     handleSubmit()
//   }

//   const handleRetry = async () => {
//     if (!userId) return

//     setIsLoading(true)
//     try {
//       await axios.delete(`/api/quiz/${currentQuiz.id}/result`, {
//         data: { userId },
//       })

//       setSelectedAnswers({})
//       setIsSubmitted(false)
//       setShowResults(false)
//       setResults(null)
//       setCurrentQuestionIndex(0)
//       setHasStarted(false)
//       setTimeSpent(0)
//       toast.success("Test reset! You can try again.")
//     } catch (error) {
//       console.error("Error resetting test:", error)
//       toast.error("Error resetting test. Please try again.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60)
//     const secs = seconds % 60
//     return `${mins}:${secs.toString().padStart(2, "0")}`
//   }

//   const timeRemaining = Math.max(0, timeLimit - timeSpent)
//   const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader text="Loading quiz..." />
//       </div>
//     )
//   }

//   if (showResults && results) {
//     return (
//       <TestResults
//         results={results}
//         sectionTitle={sectionTitle}
//         onRetry={handleRetry}
//         showLoginPrompt={showLoginPrompt}
//         userId={userId}
//       />
//     )
//   }

//   // Pre-test screen
//   if (!hasStarted && !existingResult?.completed) {
//     return (
//       <div className="max-w-4xl mx-auto p-4 md:p-6">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
//           <Card className="shadow-xl border-0 bg-white">
//             <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 md:p-6 rounded-t-lg">
//               <div className="text-center">
//                 <Trophy className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-yellow-300" />
//                 <h1 className="text-2xl md:text-3xl font-bold mb-2">{sectionTitle}</h1>
//                 <p className="text-purple-100">Practice Test</p>
//               </div>
//             </div>

//             <CardContent className="p-4 md:p-8 space-y-6">
//               {/* Quiz Selection for Logged-in Users */}
//               {userId && availableQuizzes.length > 0 && (
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold">Choose a Quiz:</h3>
//                   <Select value={selectedQuizId} onValueChange={handleQuizChange}>
//                     <SelectTrigger className="w-full">
//                       <SelectValue placeholder="Select a quiz" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {availableQuizzes.map((quiz) => (
//                         <SelectItem key={quiz.id} value={quiz.id}>
//                           <div className="flex flex-col">
//                             <span className="font-medium">{quiz.title}</span>
//                             <span className="text-sm text-muted-foreground">{quiz.totalQuestions} questions</span>
//                           </div>
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               )}

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
//                 <div className="p-4 bg-slate-50 rounded-lg">
//                   <BookOpen className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-blue-600" />
//                   <div className="font-semibold text-slate-900">{currentQuiz.questions.length}</div>
//                   <div className="text-sm text-slate-600">Questions</div>
//                 </div>
//                 <div className="p-4 bg-slate-50 rounded-lg">
//                   <Clock className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-amber-600" />
//                   <div className="font-semibold text-slate-900">{Math.floor(timeLimit / 60)} min</div>
//                   <div className="text-sm text-slate-600">Time Limit</div>
//                 </div>
//                 <div className="p-4 bg-slate-50 rounded-lg">
//                   <Target className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 text-green-600" />
//                   <div className="font-semibold text-slate-900">75%</div>
//                   <div className="text-sm text-slate-600">Pass Score</div>
//                 </div>
//               </div>

//               {!userId && (
//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                   <div className="flex items-start gap-3">
//                     <User className="h-5 w-5 text-blue-600 mt-0.5" />
//                     <div>
//                       <h3 className="font-medium text-blue-900 mb-2">Guest Mode</h3>
//                       <p className="text-blue-800 text-sm mb-3">
//                         You're taking this test as a guest. After completion, you can login to access more free tests
//                         and track your progress.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
//                 <div className="flex items-start gap-3">
//                   <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
//                   <div>
//                     <h3 className="font-medium text-amber-900 mb-2">Test Instructions</h3>
//                     <ul className="text-amber-800 text-sm space-y-1">
//                       <li>• You have {Math.floor(timeLimit / 60)} minutes to complete all questions</li>
//                       <li>• You need 75% or higher to pass</li>
//                       <li>• You can navigate between questions freely</li>
//                       <li>• Make sure to answer all questions before submitting</li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>

//               <div className="text-center">
//                 <Button onClick={startTest} size="lg" className="bg-green-600 hover:bg-green-700 px-8">
//                   <Play className="h-5 w-5 mr-2" />
//                   Start Test
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>
//     )
//   }

//   const currentQuestion = currentQuiz.questions[currentQuestionIndex]

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Compact Header */}
//       <div className="bg-white border-b shadow-sm mt-2 rounded-xl">
//         <div className="max-w-7xl mx-auto px-4 py-3">
//           <div className="flex items-center justify-between mb-2">
//             <div className="flex items-center gap-4">
//               <h1 className="text-lg md:text-xl font-bold text-slate-900">{sectionTitle}</h1>
//               <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs md:text-sm">
//                 {currentQuestionIndex + 1} / {currentQuiz.questions.length}
//               </Badge>
//             </div>
//             <div className="flex items-center gap-2 md:gap-4">
//               <div className="flex items-center gap-2 text-slate-600">
//                 <Clock className="h-4 w-4" />
//                 <span className={cn("font-mono text-sm", timeRemaining < 300 && "text-red-600 font-bold")}>
//                   {formatTime(timeRemaining)}
//                 </span>
//               </div>
//             </div>
//           </div>
//           <Progress value={progress} className="h-1.5" />
//           {timeRemaining < 300 && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
//               <div className="flex items-center gap-2 text-red-700 text-sm">
//                 <AlertTriangle className="h-4 w-4" />
//                 <span className="font-medium">Less than 5 minutes remaining!</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Question Content */}
//       <div className="max-w-7xl mx-auto py-4">
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={currentQuestionIndex}
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -20 }}
//             transition={{ duration: 0.3 }}
//           >
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Question Side */}
//               <Card className="shadow-lg border-0 bg-white h-fit  gap-4 py-4">
//                 <CardHeader>
//                   <div className="flex justify-between items-center">
//                     <CardTitle className="text-lg font-semibold text-slate-900">
//                       Task {currentQuestionIndex + 1}
//                     </CardTitle>
//                     <Badge variant="outline" className="bg-amber-50 text-amber-700">
//                       {currentQuestion.points} points
//                     </Badge>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="prose prose-sm max-w-none">
//                     <ReadOnlyEditor initialContent={currentQuestion.question} />
//                   </div>

//                   {/* Question Image */}
//                   {currentQuestion.questionImageUrl && (
//                     <div className="mt-4">
//                       <Image
//                         src={currentQuestion.questionImageUrl || "/placeholder.svg"}
//                         alt="Question illustration"
//                         width={400}
//                         height={currentQuestion.imageHeight || 200}
//                         className="rounded-lg border max-w-full h-auto"
//                       />
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               {/* Options Side */}
//               <Card className="shadow-lg border-0 bg-white h-fit py-4 gap-2">
//                 <CardHeader className="">
//                   <CardTitle className="text-lg font-semibold text-slate-900">Choose your answer(s)</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-3">
//                     {Array.isArray(currentQuestion.options) &&
//                       currentQuestion.options.map((option: string, index: number) => {
//                         const isSelected = selectedAnswers[currentQuestion.id]?.includes(option) || false

//                         return (
//                           <div
//                             key={index}
//                             className={cn(
//                               "flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ",
//                               isSelected ? "bg-blue-50 border-blue-300" : "bg-slate-50 border-slate-200",
//                               "hover:bg-slate-100",
//                             )}
//                             onClick={() => handleAnswerSelect(option)}
//                           >
                            
//                             <span className="flex-1 text-slate-700 leading-relaxed">{option}</span>
//                           </div>
//                         )
//                       })}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </motion.div>
//         </AnimatePresence>

//         {/* Navigation */}
//         <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-lg shadow-sm">
//           <Button
//             variant="outline"
//             onClick={previousQuestion}
//             disabled={currentQuestionIndex === 0}
//             className="flex items-center gap-2 bg-transparent"
//           >
//             Previous
//           </Button>

//           <div className="flex gap-3">
//             {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
//               <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
//                 <Target className="h-4 w-4" />
//                 Submit Test
//               </Button>
//             ) : (
//               <Button onClick={nextQuestion} className="flex items-center gap-2">
//                 Next
//                 <ArrowRight className="h-4 w-4" />
//               </Button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// const TestResults = ({ results, sectionTitle, onRetry, showLoginPrompt, userId }: any) => {
//   const router = useRouter()
//   const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

//   const toggleQuestion = (questionId: string) => {
//     const newExpanded = new Set(expandedQuestions)
//     if (newExpanded.has(questionId)) {
//       newExpanded.delete(questionId)
//     } else {
//       newExpanded.add(questionId)
//     }
//     setExpandedQuestions(newExpanded)
//   }

//   const getPerformanceMessage = () => {
//     if (results.percentage >= 90) {
//       return {
//         title: "Exceptional! 🏆",
//         color: "text-green-600",
//         bgColor: "bg-green-50",
//         borderColor: "border-green-200",
//       }
//     } else if (results.percentage >= 80) {
//       return {
//         title: "Excellent! 🌟",
//         color: "text-blue-600",
//         bgColor: "bg-blue-50",
//         borderColor: "border-blue-200",
//       }
//     } else if (results.percentage >= 75) {
//       return {
//         title: "Well Done! ✅",
//         color: "text-amber-600",
//         bgColor: "bg-amber-50",
//         borderColor: "border-amber-200",
//       }
//     } else {
//       return {
//         title: "Keep Studying! 📖",
//         color: "text-red-600",
//         bgColor: "bg-red-50",
//         borderColor: "border-red-200",
//       }
//     }
//   }

//   const performance = getPerformanceMessage()

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       <div className="max-w-4xl mx-auto space-y-6">
//         {/* Header with compact stats */}
//         <Card className="shadow-xl border-0 bg-white overflow-hidden">
//           <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
//             <div className="text-center">
//               <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
//               <h1 className="text-2xl md:text-3xl font-bold mb-2">Test Complete!</h1>
//               <p className="text-purple-100 text-lg">{sectionTitle}</p>
//             </div>
//           </div>

//           <CardContent className="p-6 pt-0">
//             {/* Compact Performance Summary */}
//             <div className={cn("rounded-lg p-4 mb-6", performance.bgColor, performance.borderColor, "border")}>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className={cn("text-xl font-bold", performance.color)}>{performance.title}</h2>
//                   <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
//                     <span>{results.percentage}% Score</span>
//                     <span>
//                       {results.correctAnswers}/{results.totalQuestions} Correct
//                     </span>
//                     <span>{Math.floor(results.timeSpent / 60)}m Time</span>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   {results.passed ? (
//                     <Badge className="bg-green-600 text-white">
//                       <CheckCircle className="h-4 w-4 mr-1" />
//                       Passed
//                     </Badge>
//                   ) : (
//                     <Badge variant="destructive">
//                       <AlertTriangle className="h-4 w-4 mr-1" />
//                       Failed
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Login Prompt for Guests */}
//             {showLoginPrompt && !userId && (
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
//                 <LogIn className="h-12 w-12 mx-auto mb-4 text-blue-600" />
//                 <h3 className="text-xl font-bold text-blue-900 mb-2">Want More Free Tests?</h3>
//                 <p className="text-blue-800 mb-4">
//                   You just need to login to access unlimited practice tests and track your progress!
//                 </p>
//                 <Button onClick={() => router.push("/auth/login")} className="bg-blue-600 hover:bg-blue-700">
//                   <LogIn className="h-4 w-4 mr-2" />
//                   Login Now
//                 </Button>
//               </div>
//             )}

//             {/* Detailed Results Table */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold">Question Review</h3>
//               <div className="border rounded-lg overflow-hidden">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-16">#</TableHead>
//                       <TableHead>Question</TableHead>
//                       <TableHead className="w-20">Result</TableHead>
//                       <TableHead className="w-20">Points</TableHead>
//                       <TableHead className="w-16"></TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {results.questionResults.map((result: any, index: number) => (
//                       <Collapsible key={result.question.id}>
//                         <CollapsibleTrigger asChild>
//                           <TableRow
//                             className="cursor-pointer hover:bg-slate-50"
//                             onClick={() => toggleQuestion(result.question.id)}
//                           >
//                             <TableCell className="font-medium">{index + 1}</TableCell>
//                             <TableCell className="max-w-xs">
//                               <div
//                                 className="truncate"
//                                 dangerouslySetInnerHTML={{
//                                   __html: result.question.question.substring(0, 100) + "...",
//                                 }}
//                               />
//                             </TableCell>
//                             <TableCell>
//                               {result.isCorrect ? (
//                                 <Badge className="bg-green-100 text-green-800">
//                                   <CheckCircle className="h-3 w-3 mr-1" />
//                                   Correct
//                                 </Badge>
//                               ) : (
//                                 <Badge variant="destructive">
//                                   <AlertTriangle className="h-3 w-3 mr-1" />
//                                   Wrong
//                                 </Badge>
//                               )}
//                             </TableCell>
//                             <TableCell>
//                               {result.points}/{result.question.points}
//                             </TableCell>
//                             <TableCell>
//                               {expandedQuestions.has(result.question.id) ? (
//                                 <ChevronUp className="h-4 w-4" />
//                               ) : (
//                                 <ChevronDown className="h-4 w-4" />
//                               )}
//                             </TableCell>
//                           </TableRow>
//                         </CollapsibleTrigger>
//                         <CollapsibleContent asChild>
//                           <TableRow>
//                             <TableCell colSpan={5} className="bg-slate-50">
//                               <div className="p-4 space-y-4">
//                                 <div>
//                                   <h4 className="font-medium mb-2">Question:</h4>
//                                   <div className="prose prose-sm max-w-none">
//                                     <ReadOnlyEditor initialContent={result.question.question} />
//                                   </div>
//                                 </div>

//                                 {result.question.questionImageUrl && (
//                                   <div>
//                                     <Image
//                                       src={result.question.questionImageUrl || "/placeholder.svg"}
//                                       alt="Question illustration"
//                                       width={300}
//                                       height={result.question.imageHeight || 150}
//                                       className="rounded border"
//                                     />
//                                   </div>
//                                 )}

//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                   <div>
//                                     <h4 className="font-medium mb-2 text-red-600">Your Answer(s):</h4>
//                                     <ul className="space-y-1">
//                                       {result.userAnswers.length > 0 ? (
//                                         result.userAnswers.map((answer: string, i: number) => (
//                                           <li key={i} className="text-sm bg-red-50 p-2 rounded">
//                                             {answer}
//                                           </li>
//                                         ))
//                                       ) : (
//                                         <li className="text-sm text-slate-500 italic">No answer selected</li>
//                                       )}
//                                     </ul>
//                                   </div>

//                                   <div>
//                                     <h4 className="font-medium mb-2 text-green-600">Correct Answer(s):</h4>
//                                     <ul className="space-y-1">
//                                       {result.correctAnswers.map((answer: string, i: number) => (
//                                         <li key={i} className="text-sm bg-green-50 p-2 rounded">
//                                           {answer}
//                                         </li>
//                                       ))}
//                                     </ul>
//                                   </div>
//                                 </div>

//                                 {result.question.note && (
//                                   <div>
//                                     <h4 className="font-medium mb-2">Explanation:</h4>
//                                     <div className="text-sm bg-blue-50 p-3 rounded">{result.question.note}</div>
//                                   </div>
//                                 )}
//                               </div>
//                             </TableCell>
//                           </TableRow>
//                         </CollapsibleContent>
//                       </Collapsible>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
//               {!results.passed && userId && (
//                 <Button onClick={onRetry} size="lg" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
//                   <RotateCcw className="h-5 w-5" />
//                   Retake Test
//                 </Button>
//               )}
//               <Button variant="outline" size="lg" onClick={() => router.push("/")} className="flex items-center gap-2">
//                 <ArrowRight className="h-5 w-5" />
//                 Back to Home
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }
