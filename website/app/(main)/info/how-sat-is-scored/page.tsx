import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Target, TrendingUp, ArrowLeft, Calculator, Award, AlertCircle } from "lucide-react"
import Link from "next/link"

const HowSATIsScoredPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/info">
          <Button variant="outline" className="mb-6 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Button>
        </Link>

        {/* Header */}
        <Card className="shadow-xl border-0 bg-white mb-8">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">How SAT is Scored</h1>
                <p className="text-green-100 text-base md:text-lg">
                  Understanding the SAT scoring system and what your scores mean
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Score Overview */}
        <Card className="shadow-lg border-0 bg-white mb-8 py-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Score Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <Calculator className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900 mb-1">200-800</div>
                <div className="text-sm text-blue-700">Math Section</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <Target className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <div className="text-2xl font-bold text-green-900 mb-1">200-800</div>
                <div className="text-sm text-green-700">Reading & Writing</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <Award className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <div className="text-2xl font-bold text-purple-900 mb-1">400-1600</div>
                <div className="text-sm text-purple-700">Total Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Scoring Process */}
          <Card className="shadow-lg border-0 bg-white py-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">How Scoring Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Step 1: Raw Score</h3>
                <p className="text-blue-800 mb-3">
                  Your raw score is simply the number of questions you answered correctly. There&apos;s no penalty for wrong
                  answers, so it&apos;s always better to guess than leave a question blank.
                </p>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-2">Example: Math Section</div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-900">Correct Answers: 45/58</span>
                    <span className="text-slate-500">→</span>
                    <span className="font-semibold text-blue-600">Raw Score: 45</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Step 2: Scaled Score</h3>
                <p className="text-green-800 mb-3">
                  Raw scores are converted to scaled scores (200-800) using a process called equating. This ensures
                  fairness across different test dates and versions.
                </p>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-2">Conversion Example</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Raw Score: 45</span>
                      <Progress value={77} className="w-32 h-2" />
                      <span className="font-semibold text-green-600">Scaled: 650</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Step 3: Total Score</h3>
                <p className="text-purple-800">
                  Your total SAT score is the sum of your Math and Evidence-Based Reading and Writing section scores.
                </p>
                <div className="bg-white rounded-lg p-4 mt-3">
                  <div className="text-sm text-slate-600 mb-2">Total Score Calculation</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Math Section:</span>
                      <span className="font-semibold">650</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reading & Writing:</span>
                      <span className="font-semibold">620</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold text-purple-600">
                      <span>Total Score:</span>
                      <span>1270</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Ranges */}
          <Card className="shadow-lg border-0 bg-white py-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Understanding Score Ranges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Score Percentiles</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium">1400-1600</span>
                        <Badge className="bg-red-600">99th+ percentile</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium">1300-1390</span>
                        <Badge className="bg-orange-600">90th+ percentile</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium">1200-1290</span>
                        <Badge className="bg-yellow-600">75th+ percentile</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">1050-1190</span>
                        <Badge className="bg-blue-600">50th+ percentile</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium">400-1040</span>
                        <Badge variant="outline">Below 50th percentile</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">What Scores Mean</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">1400+ (Excellent)</h4>
                        <p className="text-green-800 text-sm">
                          Competitive for top-tier colleges and universities. Eligible for merit scholarships.
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">1200-1390 (Good)</h4>
                        <p className="text-blue-800 text-sm">
                          Competitive for most colleges. Good chance of admission to state universities.
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-semibold text-amber-900 mb-2">1000-1190 (Average)</h4>
                        <p className="text-amber-800 text-sm">
                          Meets requirements for many colleges. May need to strengthen other application areas.
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-900 mb-2">Below 1000</h4>
                        <p className="text-red-800 text-sm">
                          Consider retaking the test. Focus on test prep and skill building.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscores */}
          <Card className="shadow-lg border-0 bg-white py-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Subscores and Cross-Test Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Test Subscores (1-15 scale)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Reading Test</h4>
                      <ul className="text-blue-800 text-sm space-y-1">
                        <li>• Command of Evidence</li>
                        <li>• Words in Context</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Writing and Language Test</h4>
                      <ul className="text-green-800 text-sm space-y-1">
                        <li>• Expression of Ideas</li>
                        <li>• Standard English Conventions</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Math Test</h4>
                      <ul className="text-purple-800 text-sm space-y-1">
                        <li>• Heart of Algebra</li>
                        <li>• Problem Solving and Data Analysis</li>
                        <li>• Passport to Advanced Math</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <h4 className="font-medium text-amber-900 mb-2">Cross-Test Scores (10-40 scale)</h4>
                      <ul className="text-amber-800 text-sm space-y-1">
                        <li>• Analysis in History/Social Studies</li>
                        <li>• Analysis in Science</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Improvement Tips */}
          <Card className="shadow-lg border-0 bg-white py-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Score Improvement Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Math Section
                  </h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Master algebra fundamentals and linear equations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Practice data analysis and statistics problems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Learn when to use and not use a calculator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Focus on advanced math concepts like quadratics</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Reading & Writing
                  </h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Read actively and practice finding evidence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Learn grammar rules and punctuation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Practice vocabulary in context</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Analyze charts, graphs, and data</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Pro Tip</h4>
                    <p className="text-blue-800 text-sm">
                      Most students can improve their scores by 100-200 points with dedicated practice. Take practice
                      tests under timed conditions and review your mistakes carefully.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12">
          <Link href="/info/what-is-sat">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Previous: What is SAT?
            </Button>
          </Link>
          <div className="flex gap-4">
            <Link href="/info/test-dates-registration">
              <Button className="flex items-center gap-2">
                Next: Test Dates & Registration
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowSATIsScoredPage
