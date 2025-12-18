import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Award, BookOpen, Calculator, Clock, FileText, Lightbulb, Info } from "lucide-react"
import Link from "next/link"

import React from 'react'

const AboutSatSection = () => {
  return (
    <section className="py-16 mt-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 mb-4 px-4 py-2 rounded-full shadow-lg">
              <Info className="w-3 h-3 inline mr-1" />
              Learn About SAT
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Everything You Need to Know About the SAT
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get comprehensive information about the SAT exam structure, scoring, and preparation tips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/info/what-is-sat" className="group">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                <Card className="relative border-0 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl transform rotate-6 opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                          <FileText className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">What is SAT?</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Learn about the SAT exam format, sections, and what to expect on test day
                      </p>
                      <div className="flex items-center text-cyan-600 text-sm font-semibold group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>

            <Link href="/info/how-sat-is-scored" className="group">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                <Card className="relative border-0 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl transform rotate-6 opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                          <Calculator className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">How SAT is Scored</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Understand the SAT scoring system and what your scores mean for college admissions
                      </p>
                      <div className="flex items-center text-emerald-600 text-sm font-semibold group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>

            <Link href="/info/test-dates-registration" className="group">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                <Card className="relative border-0 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl transform rotate-6 opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                          <Clock className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Test Dates & Registration</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Find upcoming SAT test dates and learn how to register for the exam
                      </p>
                      <div className="flex items-center text-purple-600 text-sm font-semibold group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>

            <Link href="/info/study-tips" className="group">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                <Card className="relative border-0 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl transform rotate-6 opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                          <Lightbulb className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Study Tips & Strategies</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Proven strategies and tips to maximize your SAT preparation effectiveness
                      </p>
                      <div className="flex items-center text-amber-600 text-sm font-semibold group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>

            <Link href="/info/college-admissions" className="group">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                <Card className="relative border-0 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl transform rotate-6 opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center">
                          <Award className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">College Admissions</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        How SAT scores impact college admissions and scholarship opportunities
                      </p>
                      <div className="flex items-center text-red-600 text-sm font-semibold group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>

            <Link href="/info" className="group">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400 to-gray-600 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                <Card className="relative border-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-gray-500 to-gray-700" />
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl transform rotate-6 opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl flex items-center justify-center">
                          <BookOpen className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">View All Articles</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Browse our complete collection of SAT preparation articles and guides
                      </p>
                      <div className="flex items-center text-gray-700 text-sm font-semibold group-hover:gap-2 transition-all">
                        View All <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>
          </div>
        </div>
      </section>
  )
}

export default AboutSatSection
