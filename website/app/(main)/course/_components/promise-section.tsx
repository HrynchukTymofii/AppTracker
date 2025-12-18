import { Card, CardContent } from '@/components/ui/card'
import React from 'react'
import { motion } from "framer-motion"

const CheckItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
      <span className="text-purple-600 font-bold text-sm">✓</span>
    </div>
    <p className="text-white text-lg flex-1">{text}</p>
  </div>
)

const PromiseSection = () => {

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="my-8 md:my-20"
    >
      <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-4 py-6 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            By the End You&apos;ll... ✨
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <CheckItem text="Master every SAT math concept (yes, even the tricky ones)" />
              <CheckItem text="Speed through reading passages like a pro" />
              <CheckItem text="Write essays that actually impress admissions officers" />
              <CheckItem text="Know exactly what to expect on test day" />
            </div>
            <div className="space-y-6">
              <CheckItem text="Have killer test-taking strategies" />
              <CheckItem text="Feel confident AF walking into that test room" />
              <CheckItem text="Get the score you need for your dream college" />
              <CheckItem text="Flex on your friends with that score increase 📈" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default PromiseSection
