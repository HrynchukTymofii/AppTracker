import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, DollarSign, Sparkles } from "lucide-react"

export function PricingSection() {
  const plans = [
    {
      name: "1 Month",
      description: "Perfect for quick review",
      price: "$49",
      period: "/month",
      features: ["Full course access", "Practice tests", "Mobile app access", "Progress tracking"],
      gradient: "from-gray-500 to-gray-700",
      glowColor: "from-gray-400 to-gray-600",
      popular: false,
    },
    {
      name: "3 Months",
      description: "Recommended preparation time",
      price: "$99",
      period: "/3 months",
      savings: "Save 33%",
      features: ["Full course access", "Practice tests", "Mobile app access", "Progress tracking", "Email support"],
      gradient: "from-cyan-500 via-blue-600 to-purple-600",
      glowColor: "from-cyan-500 to-purple-600",
      popular: true,
    },
    {
      name: "1 Year",
      description: "Maximum flexibility & value",
      price: "$149",
      period: "/year",
      savings: "Save 75%",
      features: [
        "Full course access",
        "Practice tests",
        "Mobile app access",
        "Progress tracking",
        "Priority email support",
        "Score guarantee",
      ],
      gradient: "from-emerald-500 to-green-600",
      glowColor: "from-emerald-500 to-green-600",
      popular: false,
    },
  ]

  return (
    <section className="py-16 mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 mb-4 px-4 py-2 rounded-full shadow-lg">
            <DollarSign className="w-3 h-3 inline mr-1" />
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h2>
          <p className="text-xl text-gray-600">Flexible pricing options to fit your preparation timeline</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className="relative group">
              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${plan.glowColor} rounded-3xl opacity-0 group-hover:opacity-30 blur transition duration-500 ${plan.popular ? "opacity-20" : ""}`} />

              <Card className={`relative border-0 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform ${plan.popular ? "scale-105" : "group-hover:scale-105"} overflow-hidden`}>
                {/* Gradient top bar */}
                <div className={`h-2 bg-gradient-to-r ${plan.gradient}`} />

                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full shadow-xl border-4 border-white">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardContent className="p-8 pt-10">
                  <div className="text-center space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600">{plan.description}</p>
                    </div>

                    <div>
                      <div className={`text-5xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent mb-2`}>
                        {plan.price}
                      </div>
                      <div className="text-gray-500 font-medium">{plan.period}</div>
                      {plan.savings && (
                        <div className="mt-2 inline-block px-3 py-1 bg-green-100 rounded-full">
                          <span className="text-sm text-green-700 font-bold">{plan.savings}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-left pt-4">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full h-12 bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                    >
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-gray-700 font-medium">All plans include a 30-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </section>
  )
}
