"use client"

import { motion } from "framer-motion"
import { Target, MessageCircle, AlertCircle, Bookmark } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Progress Skeleton Component
const ProgressSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center space-y-2">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="border-t pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Table Skeleton Component
const TableSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-1/3" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// Chat Skeleton Component
const ChatSkeleton = () => (
  <div className="space-y-4">
    <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-lg">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
          <div className="max-w-[80%] p-3 rounded-lg bg-white border">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-10" />
    </div>
  </div>
)

// Saved Items Skeleton Component
const SavedItemsSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-1">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8" />
      ))}
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  </div>
)

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </motion.div>

        {/* Main Grid Layout */}
        <div className="space-y-6">
          {/* Top Section - Progress Overview and Performance Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Your Progress & Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressSkeleton />
              </CardContent>
            </Card>
          </motion.div>

          {/* Bottom Section - Interactive Features in Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Ask a Tutor and Recent Mistakes */}
            <div className="space-y-6">
              {/* Ask a Tutor - Chat UI */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      Ask a Tutor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChatSkeleton />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Mistakes Review */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Recent Mistakes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TableSkeleton />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Saved Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="shadow-lg border-0 bg-white h-fit">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-amber-600" />
                    Saved Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SavedItemsSkeleton />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
