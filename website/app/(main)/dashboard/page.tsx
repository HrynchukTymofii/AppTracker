"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Star,
  AlertCircle,
  Bookmark,
  ExternalLink,
  Send,
  Trophy,
  XCircle,
  Sparkles,
  Zap,
  Award,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/lib/useAuth"
import { useRouter } from "next/navigation"

// Mock data types
interface ProgressData {
  courseProgress: number
  chapterProgress: number
  quizCompletion: number
  lastTest: {
    title: string
    score: number
    maxScore: number
    date: string
  }
  averageSATScore: number
  lessonsCompleted: number
  totalLessons: number
}

interface MistakeData {
  id: string
  questionExcerpt: string
  topic: string
  scoreImpact: number
  date: string
  difficulty: "easy" | "medium" | "hard"
}

interface SavedItem {
  id: string
  title: string
  type: "question" | "lesson" | "topic"
  category: string
  date: string
}

interface ChatMessage {
  id: string
  message: string
  isUser: boolean
  timestamp: string
}

// Mock data
const mockProgressData: ProgressData = {
  courseProgress: 68,
  chapterProgress: 45,
  quizCompletion: 72,
  lastTest: {
    title: "Math Practice Test #3",
    score: 650,
    maxScore: 800,
    date: "2024-01-15",
  },
  averageSATScore: 1280,
  lessonsCompleted: 24,
  totalLessons: 35,
}

const mockMistakes: MistakeData[] = [
  {
    id: "1",
    questionExcerpt: "If 3x + 2y = 12 and x - y = 1, what is the value of x?",
    topic: "Systems of Equations",
    scoreImpact: -15,
    date: "2024-01-15",
    difficulty: "medium",
  },
  {
    id: "2",
    questionExcerpt: "The author's primary purpose in the passage is to...",
    topic: "Reading Comprehension",
    scoreImpact: -10,
    date: "2024-01-14",
    difficulty: "hard",
  },
  {
    id: "3",
    questionExcerpt: "Which of the following best describes the function f(x) = x² - 4x + 3?",
    topic: "Quadratic Functions",
    scoreImpact: -12,
    date: "2024-01-13",
    difficulty: "easy",
  },
]

const mockSavedItems: SavedItem[] = [
  {
    id: "1",
    title: "Algebraic Expressions Practice",
    type: "question",
    category: "Math",
    date: "2024-01-15",
  },
  {
    id: "2",
    title: "Essay Writing Fundamentals",
    type: "lesson",
    category: "Writing",
    date: "2024-01-14",
  },
  {
    id: "3",
    title: "Critical Reading Strategies",
    type: "topic",
    category: "Reading",
    date: "2024-01-13",
  },
]

// Animated Circular Progress Component
const CircularProgress = ({
  value,
  size = 120,
  strokeWidth = 10,
  color = "blue",
  label,
  sublabel,
}: {
  value: number
  size?: number
  strokeWidth?: number
  color?: "blue" | "green" | "amber"
  label: string
  sublabel: string
}) => {
  const [animatedValue, setAnimatedValue] = useState(0)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 300)

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let currentStep = 0

    const numberTimer = setInterval(() => {
      currentStep++
      const currentValue = Math.min(increment * currentStep, value)
      setDisplayValue(Math.round(currentValue))

      if (currentStep >= steps) {
        clearInterval(numberTimer)
        setDisplayValue(value)
      }
    }, duration / steps)

    return () => {
      clearTimeout(timer)
      clearInterval(numberTimer)
    }
  }, [value])

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference

  const colorClasses = {
    blue: "from-cyan-500 to-blue-600",
    green: "from-emerald-500 to-green-600",
    amber: "from-amber-500 to-orange-600",
  }

  const bgColorClasses = {
    blue: "stroke-cyan-100",
    green: "stroke-emerald-100",
    amber: "stroke-amber-100",
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className={`fill-none ${bgColorClasses[color]}`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={`fill-none transition-all duration-[2000ms] ease-out`}
            style={{
              strokeDasharray,
              strokeDashoffset,
              stroke: `url(#gradient-${color})`,
            }}
          />
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={colorClasses[color].split(' ')[0].replace('from-', 'stop-')} />
              <stop offset="100%" className={colorClasses[color].split(' ')[1].replace('to-', 'stop-')} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tabular-nums">
            {displayValue}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{sublabel}</p>
      </div>
    </div>
  )
}

// Animated Number Component
const AnimatedNumber = ({
  value,
  className = "",
  duration = 2000,
}: {
  value: number
  className?: string
  duration?: number
}) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const steps = 60
    const increment = value / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const currentValue = Math.min(increment * currentStep, value)
      setDisplayValue(Math.round(currentValue))

      if (currentStep >= steps) {
        clearInterval(timer)
        setDisplayValue(value)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, duration])

  return <span className={`tabular-nums ${className}`}>{displayValue}</span>
}

// Animated Progress Bar Component
const AnimatedProgress = ({
  value,
  className = "",
}: {
  value: number
  className?: string
}) => {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 500)

    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className={`bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-[2000ms] ease-out"
        style={{ width: `${animatedValue}%` }}
      />
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuth();
  const router = useRouter();

  if (!user.isPro){
    router.push('/');
  }
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      message: "Hi! I'm your SAT tutor. How can I help you today?",
      isUser: false,
      timestamp: new Date().toISOString(),
    },
  ])
  const [newMessage, setNewMessage] = useState("")

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: newMessage,
      isUser: true,
      timestamp: new Date().toISOString(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setNewMessage("")

    setTimeout(() => {
      const tutorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message:
          "That's a great question! Let me help you understand this concept better. Would you like me to break it down step by step?",
        isUser: false,
        timestamp: new Date().toISOString(),
      }
      setChatMessages((prev) => [...prev, tutorResponse])
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6 relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-200/20 to-blue-300/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/15 to-pink-300/15 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              SAT Prep Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-600">Track your progress and continue your SAT preparation journey</p>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="space-y-6">
          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl opacity-10 blur" />
            <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  Your Progress & Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Progress Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <CircularProgress
                      value={mockProgressData.courseProgress}
                      color="blue"
                      label="Course Progress"
                      sublabel="Overall completion"
                    />
                    <CircularProgress
                      value={mockProgressData.chapterProgress}
                      color="green"
                      label="Chapter Progress"
                      sublabel="Current chapter"
                    />
                    <CircularProgress
                      value={mockProgressData.quizCompletion}
                      color="amber"
                      label="Quiz Completion"
                      sublabel="Practice tests"
                    />
                  </div>

                  {/* Performance Summary */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Performance Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <motion.div
                        className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Last Test</span>
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="font-bold text-gray-900 mb-1">{mockProgressData.lastTest.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500 text-white hover:bg-blue-600 border-0">
                            {mockProgressData.lastTest.score}/{mockProgressData.lastTest.maxScore}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {new Date(mockProgressData.lastTest.date).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>

                      <motion.div
                        className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Average SAT Score</span>
                          <Trophy className="h-5 w-5 text-emerald-500" />
                        </div>
                        <AnimatedNumber
                          value={mockProgressData.averageSATScore}
                          className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
                        />
                        <p className="text-xs text-gray-600 mt-1">Based on practice tests</p>
                      </motion.div>

                      <motion.div
                        className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Lessons Completed</span>
                          <BookOpen className="h-5 w-5 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          <AnimatedNumber value={mockProgressData.lessonsCompleted} />/{mockProgressData.totalLessons}
                        </p>
                        <AnimatedProgress
                          value={(mockProgressData.lessonsCompleted / mockProgressData.totalLessons) * 100}
                          className="h-2 mt-2"
                        />
                      </motion.div>

                      <motion.div
                        className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Study Streak</span>
                          <Star className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          <AnimatedNumber value={7} /> days
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Keep it up!</p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Ask a Tutor */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-10 blur" />
                <Card className="relative shadow-xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <Collapsible open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                              <MessageCircle className="h-5 w-5 text-white" />
                            </div>
                            Ask a Tutor
                          </div>
                          {isChatOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="h-64 overflow-y-auto space-y-3 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl">
                            {chatMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] p-3 rounded-2xl ${
                                    message.isUser
                                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg"
                                      : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                                  }`}
                                >
                                  <p className="text-sm">{message.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Ask your tutor a question..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                              className="flex-1 h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <Button
                              onClick={sendMessage}
                              size="icon"
                              className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-2xl shadow-lg"
                            >
                              <Send className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>

              {/* Mistakes Review */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl opacity-10 blur" />
                <Card className="relative shadow-xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-white" />
                      </div>
                      Recent Mistakes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockMistakes.map((mistake) => (
                        <div
                          key={mistake.id}
                          className="border-2 border-gray-100 rounded-2xl p-4 hover:bg-gray-50 hover:border-gray-200 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{mistake.questionExcerpt}</p>
                            <Badge
                              className={
                                mistake.difficulty === "easy"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"
                                  : mistake.difficulty === "medium"
                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-0"
                                    : "bg-red-100 text-red-700 hover:bg-red-100 border-0"
                              }
                            >
                              {mistake.difficulty}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="font-medium">{mistake.topic}</span>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-red-600 font-semibold">
                                <XCircle className="h-3 w-3" />
                                {mistake.scoreImpact}
                              </span>
                              <span>{new Date(mistake.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Saved Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl opacity-10 blur" />
              <Card className="relative shadow-xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden h-fit">
                <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                      <Bookmark className="h-5 w-5 text-white" />
                    </div>
                    Saved Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="questions" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-2xl">
                      <TabsTrigger value="questions" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Questions
                      </TabsTrigger>
                      <TabsTrigger value="lessons" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Lessons
                      </TabsTrigger>
                      <TabsTrigger value="topics" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Topics
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="questions" className="mt-4">
                      <div className="space-y-3">
                        {mockSavedItems
                          .filter((item) => item.type === "question")
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg border-0">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Go to
                              </Button>
                            </div>
                          ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="lessons" className="mt-4">
                      <div className="space-y-3">
                        {mockSavedItems
                          .filter((item) => item.type === "lesson")
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg border-0">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Go to
                              </Button>
                            </div>
                          ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="topics" className="mt-4">
                      <div className="space-y-3">
                        {mockSavedItems
                          .filter((item) => item.type === "topic")
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg border-0">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Go to
                              </Button>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
