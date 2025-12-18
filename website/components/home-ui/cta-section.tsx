import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Achieve Your Dream SAT Score?</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of successful students who've improved their scores with our proven system. Start your journey
          today with a free trial.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-xl">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          {/* <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-xl">
            Schedule Demo Call
          </Button> */}
        </div>
      </div>
    </section>
  )
}
