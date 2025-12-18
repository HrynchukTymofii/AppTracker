import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import React from 'react'
import { motion } from "framer-motion"
import { Button } from '@/components/ui/button'

const LetsGoSection = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <Card className="shadow-2xl border-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white mb-12 overflow-hidden relative m-1">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-indigo-600/20"></div>
        <CardContent className="p-8 md:p-12 text-center relative z-10">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Let's Go!</h2>
            <p className="text-lg md:text-2xl mb-8 opacity-90">Ready to absolutely crush the SAT?</p>
            <div className="space-y-4">
            <Button
                size="lg"
                className="text-lg md:text-xl px-8 md:px-12 py-4 md:py-6 bg-white text-purple-600 hover:bg-gray-100 font-bold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                onClick={() => {
                // Enrollment logic would go here
                window.location.reload()
                }}
            >
                Start Your Glow Up Now ✨
            </Button>
            <p className="text-base md:text-lg opacity-80">Join 2,345+ students who are already winning</p>
            <div className="flex justify-center items-center gap-4 mt-6">
                <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 md:h-6 md:w-6 fill-yellow-400 text-yellow-400" />
                ))}
                </div>
                <span className="text-base md:text-lg font-semibold">4.9/5 stars</span>
            </div>
            </div>
        </CardContent>
        </Card>
    </motion.div>
  )
}

export default LetsGoSection
