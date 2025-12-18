import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export function ReviewsSection() {
  const reviews = [
    {
      name: "Sarah M.",
      score: "1480",
      initials: "SM",
      color: "blue",
      text: "Improved my score from 1200 to 1480! The personalized study plan was exactly what I needed.",
    },
    {
      name: "James L.",
      score: "1520",
      initials: "JL",
      color: "green",
      text: "The practice tests were incredibly realistic. I felt completely prepared on test day!",
    },
    {
      name: "Emily K.",
      score: "1450",
      initials: "EK",
      color: "purple",
      text: "Amazing platform! The explanations helped me understand concepts I struggled with for months.",
    },
    {
      name: "Michael R.",
      score: "1490",
      initials: "MR",
      color: "amber",
      text: "Got into my dream college thanks to this prep course. Worth every penny!",
    },
  ]

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-green-100 text-green-800 mb-4">Student Success</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Students Say</h2>
          <p className="text-xl text-slate-600">
            Join thousands of successful students who achieved their dream scores
          </p>
        </div>

        {/* Marquee Container */}
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee space-x-6">
            {/* Review Cards - duplicated for seamless loop */}
            {[...reviews, ...reviews].map((review, index) => (
              <Card key={index} className="border-0 bg-white min-w-[300px] md:min-w-[350px] rounded-xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700">"{review.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-${review.color}-100 rounded-full flex items-center justify-center`}>
                        <span className={`text-${review.color}-600 font-semibold`}>{review.initials}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{review.name}</div>
                        <div className="text-sm text-slate-500">Score: {review.score}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-8 text-slate-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">10,000+</div>
              <div className="text-sm">Students Helped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">4.9/5</div>
              <div className="text-sm">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">240+</div>
              <div className="text-sm">Avg Score Increase</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
