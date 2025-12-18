import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, BookOpen, CheckCircle, Target, TrendingUp, Star } from "lucide-react"
import Link from "next/link"

const AboutCourseSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 mb-4 px-4 py-2 rounded-full shadow-lg">
              <Star className="w-3 h-3 inline mr-1" />
              Our Course
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Complete SAT Preparation Course
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to achieve your target score in one comprehensive program
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Card 1 - Personalized Learning */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
              <Card className="relative border-0 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl transform rotate-6 opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                        <Target className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Personalized Learning</h3>
                    <p className="text-gray-600">AI-powered study plan adapted to your strengths and weaknesses</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card 2 - Expert Content */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
              <Card className="relative border-0 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl transform rotate-6 opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Expert Content</h3>
                    <p className="text-gray-600">Created by SAT experts with 15+ years of teaching experience</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card 3 - Progress Tracking */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
              <Card className="relative border-0 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl transform rotate-6 opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Progress Tracking</h3>
                    <p className="text-gray-600">Detailed analytics and progress reports to monitor improvement</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* What's Included Section */}
          <div className="relative overflow-hidden">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl blur opacity-20" />
            <Card className="relative border-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white rounded-3xl shadow-2xl overflow-hidden">
              <CardContent className="p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <h3 className="text-3xl md:text-4xl font-bold">What's Included</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                        <div className="bg-white/20 rounded-xl p-2">
                          <CheckCircle className="h-5 w-5 text-green-300" />
                        </div>
                        <span className="text-lg">40+ hours of video lessons</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                        <div className="bg-white/20 rounded-xl p-2">
                          <CheckCircle className="h-5 w-5 text-green-300" />
                        </div>
                        <span className="text-lg">1000+ practice questions</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                        <div className="bg-white/20 rounded-xl p-2">
                          <CheckCircle className="h-5 w-5 text-green-300" />
                        </div>
                        <span className="text-lg">8 full-length practice tests</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                        <div className="bg-white/20 rounded-xl p-2">
                          <CheckCircle className="h-5 w-5 text-green-300" />
                        </div>
                        <span className="text-lg">Detailed explanations for every question</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                        <div className="bg-white/20 rounded-xl p-2">
                          <CheckCircle className="h-5 w-5 text-green-300" />
                        </div>
                        <span className="text-lg">Mobile app for studying on-the-go</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="aspect-video bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                      <video
                        className="w-full h-full object-cover"
                        poster="/placeholder.svg?height=400&width=600"
                        controls
                        preload="metadata"
                      >
                        <source src="/course-preview.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="text-center mt-8">
                      <Link href="/course">
                        <Button
                          size="lg"
                          className="bg-white text-purple-600 hover:bg-gray-100 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                        >
                          Explore Full Course
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
  )
}

export default AboutCourseSection
