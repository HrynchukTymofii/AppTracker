"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, Plus, Minus, MessageCircle, Mail } from "lucide-react"

const faqs = [
  {
    question: "What is the duration of this course?",
    answer:
      "The course is designed to be completed in 8-12 weeks, with approximately 5-7 hours of study time per week. However, you can learn at your own pace as you have lifetime access to all materials.",
  },
  {
    question: "Do I need any prior experience?",
    answer:
      "No prior experience is required! This course is designed for beginners and will take you from zero to hero. We start with the fundamentals and gradually build up to more advanced concepts.",
  },
  {
    question: "What kind of support is available?",
    answer:
      "You'll have access to our community forum, weekly live Q&A sessions, and direct messaging with instructors. Our support team typically responds within 24 hours.",
  },
  {
    question: "Is there a certificate upon completion?",
    answer:
      "Yes! Upon successful completion of all modules and projects, you'll receive a verified certificate that you can add to your LinkedIn profile and resume.",
  },
  {
    question: "What if I'm not satisfied with the course?",
    answer:
      "We offer a 30-day money-back guarantee. If you're not completely satisfied within the first 30 days, we'll provide a full refund, no questions asked.",
  },
  {
    question: "Can I access the course on mobile devices?",
    answer:
      "Our platform is fully responsive and optimized for mobile devices. You can learn on-the-go using your smartphone or tablet.",
  },
]

import React from 'react'

const StillHaveQuestionsCard = () => {
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-8"
    >
        <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-0 shadow-lg">
        <CardContent className="p-8 text-center">
            <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Still have questions?</h3>
            <p className="text-slate-600 max-w-md mx-auto">
                Can't find the answer you're looking for? Our friendly support team is here to help you succeed.
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105">
                Contact Support
            </Button>
            </div>
        </CardContent>
        </Card>
    </motion.div>
  )
}


export default function FaqSection() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="py-16 px-4 max-w-7xl mx-auto"
    >
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
        {/* Left Column - Header and Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:sticky lg:top-8"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Frequently Asked Questions</h2>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">
                Everything you need to know about the course. Can't find the answer you're looking for? Feel free to
                reach out to our support team.
              </p>
            </div>
            <div className="hidden lg:block">
                <StillHaveQuestionsCard />
            </div>
            
          </div>
        </motion.div>

        {/* Right Column - FAQ Cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className="shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 overflow-hidden p-6 pb-5">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors duration-200 p2-4"
                  onClick={() => toggleItem(index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900 pr-4 leading-tight">
                      {faq.question}
                    </CardTitle>
                    <motion.div
                      animate={{ rotate: expandedItem === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      {expandedItem === index ? (
                        <Minus className="h-5 w-5 text-slate-500" />
                      ) : (
                        <Plus className="h-5 w-5 text-slate-500" />
                      )}
                    </motion.div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {expandedItem === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <CardContent className="pt-0 pb-6">
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
            <div className="lg:hidden">
                <StillHaveQuestionsCard />
            </div>
          
        </motion.div>
      </div>
    </motion.div>
  )
}
