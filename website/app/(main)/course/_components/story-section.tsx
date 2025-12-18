import React from 'react'
import { motion } from "framer-motion"
import Image from 'next/image'

const StorySection = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="mb-16 mt-20">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 py-1">
            Your SAT Success Story Starts Here
            </h2>
            <p className="text-xl text-slate-600">Follow the proven path to your dream score</p>
        </div>

        <div className="space-y-16">
            {/* Story Card 01 - Overall Course */}
            <div className="relative">
                <div className="absolute left-4 md:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                    <div className="relative pl-12 md:pl-20">
                    <div className="absolute left-0 top-0 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl">
                        01
                    </div>
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-100">
                        <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                        MASTER THE CORE CONCEPTS TESTED
                        </h3>
                        <h4 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Watch & Learn</h4>
                        <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-4">
                        Dive into 110+ bite-sized lessons that cover all the essential SAT math, reading, and grammar
                        concepts, along with effective test-taking strategies.
                        </p>
                        <p className="text-slate-700 font-medium">
                        Our lessons are organized into 8 modules to keep you on track no matter if you are prepping
                        early or in a time crunch.
                        </p>
                    </div>
                    </div>
                    <div className="order-first md:order-last">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 md:p-6 shadow-xl">
                            <img
                                src="/1del.png"
                                alt="Online learning interface"
                                className="w-full h-auto rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Story Card 02 - Tests & System */}
            <div className="relative">
            <div className="absolute left-4 md:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                <div className="relative pl-12 md:pl-20">
                <div className="absolute left-0 top-0 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl">
                    02
                </div>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-100">
                    <h3 className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                    PRACTICE WITH REAL SAT QUESTIONS
                    </h3>
                    <h4 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Test & Improve</h4>
                    <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-4">
                    Our adaptive testing system uses actual SAT questions to identify your weak spots and create
                    personalized practice sessions.
                    </p>
                    <p className="text-slate-700 font-medium">
                    Get instant feedback, detailed explanations, and track your progress with our smart analytics
                    dashboard.
                    </p>
                </div>
                </div>
                <div className="order-first md:order-last">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 md:p-6 shadow-xl">
                        <img
                            src="/2del.png"
                            alt="Online learning interface"
                            className="w-full h-auto rounded-lg"
                        />
                    </div>
                </div>
            </div>
            </div>

            {/* Story Card 03 - Communication */}
            <div className="relative">
            <div className="absolute left-4 md:left-6 top-0 bottom-16 w-0.5 bg-gradient-to-b from-pink-500 to-orange-500"></div>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                <div className="relative pl-12 md:pl-20">
                <div className="absolute left-0 top-0 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl">
                    03
                </div>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-100">
                    <h3 className="text-2xl md:text-3xl font-bold text-pink-600 mb-2">
                    GET SUPPORT WHEN YOU NEED IT
                    </h3>
                    <h4 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Connect & Succeed</h4>
                    <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-4">
                    Join our vibrant community of SAT prep students. Get help from instructors, share tips with
                    peers, and celebrate your wins together.
                    </p>
                    <p className="text-slate-700 font-medium">
                    24/7 chat support, weekly live Q&A sessions, and a community that's got your back every step of
                    the way.
                    </p>
                </div>
                </div>
                <div className="order-first md:order-last">
                    <div className="bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl p-4 md:p-6 shadow-xl">
                        <img
                            src="/1del.png"
                            alt="Online learning interface"
                            className="w-full h-auto rounded-lg"
                        />
                    </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    </motion.div>
  )
}

export default StorySection
