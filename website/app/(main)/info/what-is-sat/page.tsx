import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Users, Target, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

const WhatIsSATPage = () => {
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">What is SAT?</h1>
                <p className="text-blue-100 text-base md:text-lg">
                  A comprehensive guide to understanding the SAT exam
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Facts */}
        <Card className="shadow-lg border-0 bg-white mb-8 py-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Quick Facts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="font-semibold text-slate-900">3 hours</div>
                <div className="text-sm text-slate-600">Test Duration</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="font-semibold text-slate-900">1600</div>
                <div className="text-sm text-slate-600">Max Score</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="font-semibold text-slate-900">2 Sections</div>
                <div className="text-sm text-slate-600">Main Areas</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <div className="font-semibold text-slate-900">1.5M+</div>
                <div className="text-sm text-slate-600">Annual Test Takers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <Card className="shadow-lg border-0 bg-white py-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Introduction to SAT</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                The SAT (Scholastic Assessment Test) is a standardized test widely used for college admissions in the
                United States. Originally called the Scholastic Aptitude Test, the SAT is developed and administered by
                the College Board and is designed to assess a student&apos;s readiness for college.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Key Purpose</h3>
                <p className="text-blue-800">
                  The SAT provides colleges with a common data point that can be used to compare all applicants,
                  regardless of their high school background, curriculum, or grading standards.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Test Structure */}
          <Card className="shadow-lg border-0 bg-white py-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Test Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <h3 className="text-xl font-semibold text-blue-900 mb-3">Evidence-Based Reading and Writing</h3>
                    <div className="space-y-2 text-blue-800">
                      <p>• Reading Test: 52 questions, 65 minutes</p>
                      <p>• Writing and Language Test: 44 questions, 35 minutes</p>
                      <p>• Score Range: 200-800</p>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <h3 className="text-xl font-semibold text-green-900 mb-3">Math</h3>
                    <div className="space-y-2 text-green-800">
                      <p>• Calculator Section: 38 questions, 55 minutes</p>
                      <p>• No Calculator Section: 20 questions, 25 minutes</p>
                      <p>• Score Range: 200-800</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-amber-900 mb-3">Optional Essay (Discontinued)</h3>
                  <p className="text-amber-800">
                    As of June 2021, the College Board discontinued the optional SAT Essay. Most colleges no longer
                    require or consider SAT Essay scores for admissions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Areas */}
          <Card className="shadow-lg border-0 bg-white py-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">What the SAT Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Reading Test</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-800">Passage Types:</h4>
                      <ul className="space-y-1 text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Literature
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Historical Documents
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Social Science
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Natural Science
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-800">Skills Tested:</h4>
                      <ul className="space-y-1 text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Reading Comprehension
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Vocabulary in Context
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Analysis of Evidence
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Data Interpretation
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Math Test</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-800">Topics Covered:</h4>
                      <ul className="space-y-1 text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Algebra
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Geometry & Trigonometry
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Data Analysis
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Advanced Math
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-800">Question Types:</h4>
                      <ul className="space-y-1 text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Multiple Choice
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Student-Produced Response
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Real-World Applications
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Multi-Step Problems
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Take the SAT */}
          <Card className="shadow-lg border-0 bg-white py-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Why Take the SAT?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">College Admissions</h3>
                  <p className="text-slate-700">
                    Most colleges and universities in the US use SAT scores as part of their admissions process. A good
                    SAT score can significantly improve your chances of getting into your dream school.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Scholarships</h3>
                  <p className="text-slate-700">
                    Many scholarship programs use SAT scores as criteria for awarding financial aid. Higher scores can
                    lead to more scholarship opportunities.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">College Readiness</h3>
                  <p className="text-slate-700">
                    The SAT helps assess your readiness for college-level work and can guide you in choosing appropriate
                    courses and support services.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">National Recognition</h3>
                  <p className="text-slate-700">
                    High SAT scores can qualify you for national recognition programs and honors that look great on
                    college applications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12">
          <Link href="/info">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Button>
          </Link>
          <div className="flex gap-4">
            <Link href="/info/how-sat-is-scored">
              <Button className="flex items-center gap-2">
                Next: How SAT is Scored
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatIsSATPage
