"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Target, ArrowRight } from "lucide-react"
import Link from "next/link"

const ArticlesPage = () => {
  const articles = [
    {
      title: "What is SAT?",
      description: "Learn about the SAT exam, its purpose, structure, and importance for college admissions.",
      icon: BookOpen,
      href: "/articles/what-is-sat",
      color: "from-blue-500 to-purple-600",
    },
    {
      title: "How SAT is Scored",
      description: "Understand the SAT scoring system, score ranges, and how your performance is evaluated.",
      icon: Target,
      href: "/articles/how-sat-is-scored",
      color: "from-green-500 to-blue-500",
    },
    {
      title: "Test Dates & Registration",
      description: "Find out about SAT test dates, registration process, deadlines, and important information.",
      icon: Calendar,
      href: "/articles/test-dates-registration",
      color: "from-purple-500 to-pink-500",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">SAT Resources</h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Everything you need to know about the SAT exam. From basics to advanced preparation strategies.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {articles.map((article) => (
            <Card
              key={article.href}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden pb-6"
            >
              <div className={`h-2 bg-gradient-to-r ${article.color}`} />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${article.color}`}>
                    <article.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">{article.description}</p>
                <Link href={article.href}>
                  <Button className="w-full group-hover:bg-blue-600 transition-colors flex items-center gap-2">
                    Read Article
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ArticlesPage
