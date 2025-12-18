"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, BookOpen, Target, Trophy, AlertTriangle, CheckCircle, Play, RotateCcw, ArrowRight } from "lucide-react"
import { Loader } from "@/components/loader"
import toast from "react-hot-toast"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { ReadOnlyEditor } from "@/components/tiptap-templates/simple/readonly-editor"

interface ComprehensiveTestProps {
  course: any
  questions: Array<{
    id: string
    position: number
    question: string
    options: string[]
    answers: string[]
    points: number
    note: string | null
  }>
  userId: string
  existingResult: any
}

export const ComprehensiveTest = ({ course, questions, userId, existingResult }: ComprehensiveTestProps) => {
  
  const [hasStarted, setHasStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [timeLimit] = useState(questions.length * 90) // 90 seconds per question

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

  const startTest = () => {
    setHasStarted(true)
    setStartTime(Date.now())
    toast.success("Test started! Good luck!")
  }

  const handleAnswerSelect = (option: string) => {
    const questionId = questions[currentQuestionIndex].id
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

    questions.forEach((question) => {
      const correctAnswers = question.answers
      const userAnswers = answers[question.id] || []
      const isCorrect =
        correctAnswers.every((a) => userAnswers.includes(a)) && userAnswers.length === correctAnswers.length

      if (isCorrect) {
        earnedPoints += question.points
      }
    })

    const percentage = Math.round((earnedPoints / totalMaxPoints) * 100)
    const passed = percentage >= 75 // 75% passing grade for comprehensive test

    setResults({
      earnedPoints,
      totalMaxPoints,
      percentage,
      passed,
      timeSpent,
      correctAnswers: questions.filter((q) => {
        const userAnswers = answers[q.id] || []
        return q.answers.every((a) => userAnswers.includes(a)) && userAnswers.length === q.answers.length
      }).length,
      totalQuestions: questions.length,
    })

    setShowResults(true)
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
    //   const response = await axios.post("/api/test/submit", {
    //     userId,
    //     courseId: course.id,
    //     answers: selectedAnswers,
    //     timeSpent,
    //   })

    //   if (response.status === 200) {
        setIsSubmitted(true)
        calculateAndShowResults(selectedAnswers)
        toast.success("Test submitted successfully!")
    //   }
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
    setIsLoading(true)

    try {
      await axios.delete(`/api/test/${course.id}/result`, {
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
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader text="Processing your test..." />
      </div>
    )
  }

  if (showResults && results) {
    return <TestResults results={results} course={course} onRetry={handleRetry} />
  }

  // Pre-test screen
  if (!hasStarted && !existingResult?.completed) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-xl border-0 bg-white py-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
              <div className="text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
                <h1 className="text-3xl font-bold mb-2">Comprehensive Course Test</h1>
                <p className="text-purple-100">{course.title}</p>
              </div>
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold text-slate-900">{questions.length}</div>
                  <div className="text-sm text-slate-600">Questions</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                  <div className="font-semibold text-slate-900">{Math.floor(timeLimit / 60)} min</div>
                  <div className="text-sm text-slate-600">Time Limit</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-semibold text-slate-900">75%</div>
                  <div className="text-sm text-slate-600">Pass Score</div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-900 mb-2">Test Instructions</h3>
                    <ul className="text-amber-800 text-sm space-y-1">
                      <li>• This is a comprehensive test covering all course material</li>
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

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-white py-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">Course Comprehensive Test</CardTitle>
              <p className="text-slate-600 mt-1">{course.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4" />
                <span className={cn("font-mono", timeRemaining < 300 && "text-red-600 font-bold")}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {currentQuestionIndex + 1} of {questions.length}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-4" />
          {timeRemaining < 300 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Warning: Less than 5 minutes remaining!</span>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg border-0 bg-white py-6">
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
            <CardContent className="space-y-6">
              <ReadOnlyEditor initialContent={currentQuestion.question}/>
              

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion.id]?.includes(option) || false

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                        isSelected ? "bg-blue-50 border-blue-300" : "bg-slate-50 border-slate-200",
                        "hover:bg-slate-100",
                      )}
                      onClick={() => handleAnswerSelect(option)}
                    >
                      {/* <Checkbox checked={isSelected} className="h-5 w-5" onChange={() => handleAnswerSelect(option)} /> */}
                      <span className="flex-1 text-slate-700">{option}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2"
        >
          Previous
        </Button>

        <div className="flex gap-3">
          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Submit Test
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="flex items-center gap-2">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

const TestResults = ({ results, course, onRetry }: any) => {
  const router = useRouter()

  const getPerformanceMessage = () => {
    if (results.percentage >= 90) {
      return {
        title: "Exceptional Mastery! 🏆",
        message: "Outstanding! You've demonstrated exceptional understanding of the course material.",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      }
    } else if (results.percentage >= 80) {
      return {
        title: "Excellent Performance! 🌟",
        message: "Great job! You have a strong grasp of the course concepts.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      }
    } else if (results.percentage >= 75) {
      return {
        title: "Well Done! ✅",
        message: "You passed! You've shown good understanding of the material.",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      }
    } else {
      return {
        title: "Keep Studying! 📖",
        message: "You're on the right track! Review the course material and try again.",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      }
    }
  }

  const performance = getPerformanceMessage()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="shadow-xl border-0 bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
            <div className="text-center">
              <Trophy className="h-20 w-20 mx-auto mb-4 text-yellow-300" />
              <h1 className="text-4xl font-bold mb-2">Test Complete!</h1>
              <p className="text-purple-100 text-lg">{course.title}</p>
            </div>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">{results.percentage}%</div>
                <div className="text-slate-600">Final Score</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <div className="text-slate-600">Correct Answers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  {results.earnedPoints}/{results.totalMaxPoints}
                </div>
                <div className="text-slate-600">Points Earned</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">{Math.floor(results.timeSpent / 60)}m</div>
                <div className="text-slate-600">Time Taken</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className={cn("shadow-lg border-2", performance.borderColor, performance.bgColor)}>
          <CardContent className="p-8 text-center space-y-6">
            <h2 className={cn("text-3xl font-bold", performance.color)}>{performance.title}</h2>
            <p className="text-slate-700 text-xl">{performance.message}</p>
            {results.passed ? (
              <Badge className="bg-green-600 text-white px-6 py-3 text-xl">
                <CheckCircle className="h-6 w-6 mr-2" />
                Course Completed
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-6 py-3 text-xl">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Needs Improvement
              </Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!results.passed && (
            <Button onClick={onRetry} size="lg" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Retake Test
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push(`/course`)}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-5 w-5" />
            Back to Course
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
