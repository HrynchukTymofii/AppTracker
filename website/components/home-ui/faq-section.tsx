import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

export function FAQSection() {
  const faqs = [
    {
      question: "How much can I realistically improve my SAT score?",
      answer:
        "Most students see improvements of 100-300 points with dedicated preparation. Our average student improves by 240 points. The key is consistent practice and focusing on your weak areas.",
      color: "blue",
    },
    {
      question: "How long should I prepare for the SAT?",
      answer:
        "We recommend 2-4 months of preparation, studying 30-60 minutes daily. This gives you enough time to learn concepts, practice, and take multiple practice tests without burning out.",
      color: "green",
    },
    {
      question: "Can I access the course on my mobile device?",
      answer:
        "Yes! Our platform is fully mobile-responsive and we also offer a dedicated mobile app. You can study anywhere, anytime, and your progress syncs across all devices.",
      color: "purple",
    },
    {
      question: "What if I'm not satisfied with the course?",
      answer:
        "We offer a 30-day money-back guarantee. If you're not completely satisfied with our course within the first 30 days, we'll refund your payment in full, no questions asked.",
      color: "amber",
    },
  ]

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-slate-100 text-slate-800 mb-4">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-slate-600">Get answers to common questions about our SAT prep program</p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <Card key={index} className="shadow-lg border-0 bg-white rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 bg-${faq.color}-100 rounded-xl`}>
                    <HelpCircle className={`h-5 w-5 text-${faq.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
