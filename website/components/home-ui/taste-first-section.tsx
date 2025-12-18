import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, BookOpen, Calculator, Play, Zap } from "lucide-react"
import Link from "next/link"

const TasteFirstSection = () => {
  return (
    <section className="py-16 mt-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full mb-4">
              <Zap className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-semibold text-cyan-700">Try it Free</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Try Before You Buy
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience our platform with a free practice test and sample lesson
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Practice Test Card */}
            <div className="group relative">
              {/* Glow effect on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-30 blur transition duration-500" />

              <Card className="relative border-0 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform group-hover:scale-105">
                {/* Gradient accent */}
                <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />

                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    {/* 3D Icon container */}
                    <div className="relative mx-auto w-20 h-20">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl transform rotate-6 opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <Calculator className="h-10 w-10 text-white" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Free Practice Test</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Take a full-length SAT practice test and get detailed score analysis
                      </p>
                    </div>

                    <Link href="/test" className="block">
                      <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white w-full rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
                        Start Practice Test
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>

                    {/* Stats badges */}
                    <div className="flex justify-center gap-4 pt-2">
                      <div className="px-3 py-1 bg-blue-50 rounded-full">
                        <span className="text-sm font-semibold text-blue-700">2 hours</span>
                      </div>
                      <div className="px-3 py-1 bg-cyan-50 rounded-full">
                        <span className="text-sm font-semibold text-cyan-700">Full Report</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sample Lesson Card */}
            <div className="group relative">
              {/* Glow effect on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl opacity-0 group-hover:opacity-30 blur transition duration-500" />

              <Card className="relative border-0 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform group-hover:scale-105">
                {/* Gradient accent */}
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-500" />

                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    {/* 3D Icon container */}
                    <div className="relative mx-auto w-20 h-20">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl transform rotate-6 opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <BookOpen className="h-10 w-10 text-white" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Sample Lesson</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Preview our comprehensive course with a free lesson on algebra fundamentals
                      </p>
                    </div>

                    <Link href="/course" className="block">
                      <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white w-full rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105">
                        Watch Free Lesson
                        <Play className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>

                    {/* Stats badges */}
                    <div className="flex justify-center gap-4 pt-2">
                      <div className="px-3 py-1 bg-emerald-50 rounded-full">
                        <span className="text-sm font-semibold text-emerald-700">30 min</span>
                      </div>
                      <div className="px-3 py-1 bg-green-50 rounded-full">
                        <span className="text-sm font-semibold text-green-700">HD Video</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
  )
}

export default TasteFirstSection
