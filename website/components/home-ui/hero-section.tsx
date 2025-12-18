import { ArrowRight, Play, Trophy, Sparkles, GraduationCap } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'


const HeroSection = () => {
  return (
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Animated gradient background with 3D effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 rounded-3xl" />

        {/* Floating gradient orbs for depth */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 px-4 py-2 rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300">
                <Sparkles className="w-4 h-4 inline mr-2" />
                #1 SAT Prep Platform
              </Badge>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Master the SAT with
                </span>
                <span className="block mt-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                  Confidence
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Join thousands of students who've improved their scores by 200+ points. Get personalized prep, practice
                tests, and expert guidance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">10k+</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">98%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">4.9★</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* 3D Card with glassmorphism */}
              <div className="relative transform perspective-1000 hover:scale-105 transition-transform duration-500">
                <Card className="border-0 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/20 overflow-hidden">
                  {/* Gradient top bar */}
                  <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

                  <CardContent className="p-8">
                    <div className="text-center space-y-6">
                      {/* Floating icon with gradient background */}
                      <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl transform rotate-6 opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-2xl flex items-center justify-center">
                          <Trophy className="h-10 w-10 text-white" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Average Score Increase</h3>
                        <div className="text-6xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                          +240
                        </div>
                        <p className="text-gray-500 font-medium">Points improvement</p>
                      </div>

                      {/* Progress indicator */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Your potential</span>
                          <span>90%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full w-[90%] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-br from-green-400 to-emerald-500 text-white px-4 py-2 rounded-2xl shadow-xl transform rotate-6 hover:rotate-12 transition-transform">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    <span className="font-bold">Proven Results</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}

export default HeroSection
