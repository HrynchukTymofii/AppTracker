"use client"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Edit3,
  Trophy,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Star,
  Award,
  Settings,
  Lock,
  CreditCard,
  LogOut,
  Camera,
  Shield,
  Zap,
  Brain,
  Clock,
  CheckCircle,
  GraduationCap,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { signOut } from "next-auth/react"

// Mock user data
const mockUserData = {
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  avatar: "/placeholder.svg?height=120&width=120",
  league: "Pro",
  joinDate: "2023-09-15",
  stats: {
    totalPoints: 2847,
    lessonsCompleted: 42,
    quizzesTaken: 28,
    averageSATScore: 1340,
  },
  progress: {
    courseProgress: 78,
    chapterProgress: 65,
    completedModules: 15,
    totalModules: 20,
  },
  achievements: [
    {
      id: 1,
      title: "First Steps",
      description: "Completed First Lesson",
      icon: BookOpen,
      unlocked: true,
      color: "blue",
    },
    { id: 2, title: "High Scorer", description: "Scored 700+", icon: Trophy, unlocked: true, color: "amber" },
    {
      id: 3,
      title: "Consistent",
      description: "Active 7 days straight",
      icon: Calendar,
      unlocked: true,
      color: "green",
    },
    { id: 4, title: "Math Master", description: "Aced 10 Math quizzes", icon: Brain, unlocked: true, color: "purple" },
    {
      id: 5,
      title: "Speed Reader",
      description: "Complete 5 Reading sections under time",
      icon: Zap,
      unlocked: false,
      color: "gray",
    },
    {
      id: 6,
      title: "Perfect Practice",
      description: "Score 100% on any quiz",
      icon: Star,
      unlocked: false,
      color: "gray",
    },
  ],
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

  return <Progress value={animatedValue} className={`transition-all duration-[2000ms] ease-out ${className}`} />
}

// League Badge Component
const LeagueBadge = ({ league }: { league: string }) => {
  const getBadgeStyle = (league: string) => {
    switch (league.toLowerCase()) {
      case "beginner":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
      case "intermediate":
        return "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
      case "pro":
        return "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-700 text-white"
    }
  }

  return (
    <Badge className={`${getBadgeStyle(league)} font-semibold px-4 py-1.5 rounded-full shadow-lg border-0`}>
      <Shield className="h-4 w-4 mr-1" />
      {league}
    </Badge>
  )
}

// Achievement Badge Component
const AchievementBadge = ({
  achievement,
  delay = 0,
}: {
  achievement: (typeof mockUserData.achievements)[0]
  delay?: number
}) => {
  const Icon = achievement.icon
  const colorClasses = {
    blue: achievement.unlocked
      ? "bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-300"
      : "bg-gray-100 border-gray-200",
    amber: achievement.unlocked
      ? "bg-gradient-to-br from-amber-50 to-orange-100 border-amber-300"
      : "bg-gray-100 border-gray-200",
    green: achievement.unlocked
      ? "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300"
      : "bg-gray-100 border-gray-200",
    purple: achievement.unlocked
      ? "bg-gradient-to-br from-purple-50 to-pink-100 border-purple-300"
      : "bg-gray-100 border-gray-200",
    gray: "bg-gray-100 border-gray-200",
  }

  const iconColorClasses = {
    blue: achievement.unlocked ? "text-blue-600" : "text-gray-400",
    amber: achievement.unlocked ? "text-amber-600" : "text-gray-400",
    green: achievement.unlocked ? "text-emerald-600" : "text-gray-400",
    purple: achievement.unlocked ? "text-purple-600" : "text-gray-400",
    gray: "text-gray-400",
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`relative p-5 rounded-2xl border-2 transition-all hover:scale-105 ${
        colorClasses[achievement.color as keyof typeof colorClasses]
      } ${achievement.unlocked ? "cursor-pointer shadow-lg" : "cursor-not-allowed opacity-60"}`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-xl ${achievement.unlocked ? "bg-white shadow-md" : "bg-gray-200"}`}>
          <Icon className={`h-7 w-7 ${iconColorClasses[achievement.color as keyof typeof iconColorClasses]}`} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-gray-900">{achievement.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
        </div>
        {achievement.unlocked && (
          <CheckCircle className="absolute -top-2 -right-2 h-6 w-6 text-emerald-600 bg-white rounded-full shadow-lg" />
        )}
      </div>
    </motion.div>
  )
}

export default function UserProfilePage() {
  const {user, isPro} = useAuth();
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  if(!user){
    router.push('/');
    return
  }

  const handleLogout = () => {
    startTransition(() => {
      signOut({
        callbackUrl: "/",
      }).catch(() => {
        toast.error("Error", {
          description: "Failed to log out of the account",
        });
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6 relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-200/20 to-pink-300/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-br from-blue-200/15 to-cyan-300/15 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-10 blur" />
          <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Profile Image */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
                  <Avatar className="relative h-28 w-28 md:h-36 md:w-36 border-4 border-white shadow-2xl">
                    <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name || 'Student'} />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                      {user.name ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("") : <GraduationCap className="h-12 w-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-xl border-4 border-white"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {user.name || 'Student'}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{user.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                    {isPro && <LeagueBadge league="Pro" />}
                    <Badge className="bg-white border-2 border-gray-200 text-gray-700 shadow-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined{" "}
                      {new Date(mockUserData.joinDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </Badge>
                  </div>
                </div>

                {/* Edit Button */}
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-2xl shadow-lg">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl opacity-10 blur" />
          <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  className="text-center p-5 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl border-2 border-blue-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Trophy className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  <AnimatedNumber
                    value={mockUserData.stats.totalPoints}
                    className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent block"
                  />
                  <p className="text-sm text-gray-700 font-medium mt-1">Total Points</p>
                </motion.div>

                <motion.div
                  className="text-center p-5 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border-2 border-emerald-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <BookOpen className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                  <AnimatedNumber
                    value={mockUserData.stats.lessonsCompleted}
                    className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent block"
                  />
                  <p className="text-sm text-gray-700 font-medium mt-1">Lessons Done</p>
                </motion.div>

                <motion.div
                  className="text-center p-5 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl border-2 border-purple-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Target className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                  <AnimatedNumber
                    value={mockUserData.stats.quizzesTaken}
                    className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent block"
                  />
                  <p className="text-sm text-gray-700 font-medium mt-1">Quizzes Taken</p>
                </motion.div>

                <motion.div
                  className="text-center p-5 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl border-2 border-amber-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Star className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <AnimatedNumber
                    value={mockUserData.stats.averageSATScore}
                    className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent block"
                  />
                  <p className="text-sm text-gray-700 font-medium mt-1">Avg SAT Score</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl opacity-10 blur" />
          <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mockUserData.achievements.map((achievement, index) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} delay={index * 0.1} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings & Account Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400 to-gray-600 rounded-3xl opacity-10 blur" />
          <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-gray-500 to-gray-700" />
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl shadow-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="justify-start h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl shadow-sm">
                  <User className="h-5 w-5 mr-3" />
                  Edit Profile
                </Button>

                <Button className="justify-start h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl shadow-sm">
                  <Lock className="h-5 w-5 mr-3" />
                  Change Password
                </Button>

                <Button className="justify-start h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl shadow-sm">
                  <CreditCard className="h-5 w-5 mr-3" />
                  Manage Subscription
                </Button>

                <Button
                  className="justify-start h-14 bg-white hover:bg-red-50 border-2 border-gray-200 hover:border-red-200 text-gray-900 hover:text-red-600 rounded-2xl shadow-sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
