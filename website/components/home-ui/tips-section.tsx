import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Calculator, CheckCircle, Clock, Target, TrendingUp } from "lucide-react"

export function TipsSection() {
  const tips = [
    {
      icon: Clock,
      title: "Time Management",
      description:
        "Learn to pace yourself effectively. Spend no more than 1.5 minutes per question in Reading and Writing sections.",
      color: "blue",
    },
    {
      icon: Target,
      title: "Process of Elimination",
      description: "Always eliminate obviously wrong answers first. This increases your chances even when guessing.",
      color: "green",
    },
    {
      icon: BookOpen,
      title: "Read Actively",
      description: "Engage with passages by underlining key points and making mental summaries as you read.",
      color: "purple",
    },
    {
      icon: Calculator,
      title: "Calculator Strategy",
      description: "Use your calculator wisely. Some problems are faster to solve by hand than with a calculator.",
      color: "amber",
    },
    {
      icon: CheckCircle,
      title: "Practice Consistently",
      description: "Study for 30-60 minutes daily rather than cramming. Consistent practice leads to better retention.",
      color: "red",
    },
    {
      icon: TrendingUp,
      title: "Review Mistakes",
      description: "Always review incorrect answers. Understanding your mistakes is key to improvement.",
      color: "teal",
    },
  ]

  return (
    <section className="py-16 bg-white rounded-3xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-amber-100 text-amber-800 mb-4">Pro Tips</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">SAT Success Tips</h2>
          <p className="text-xl text-slate-600">Expert strategies to maximize your SAT performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tips.map((tip, index) => (
            <Card
              key={index}
              className={`shadow-lg border-0 bg-gradient-to-br from-${tip.color}-50 to-${tip.color}-100 rounded-xl`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className={`p-3 bg-${tip.color}-600 rounded-xl w-fit`}>
                    <tip.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold text-${tip.color}-900`}>{tip.title}</h3>
                  <p className={`text-${tip.color}-800`}>{tip.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
