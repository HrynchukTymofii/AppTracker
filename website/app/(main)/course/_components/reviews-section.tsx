import { AvatarFallback, Avatar } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import React from 'react'
import { motion } from "framer-motion"

const ReviewsSection = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <div className="mb-12">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 py-1">
            What Students Are Saying 💬
            </h2>
            <p className="text-xl text-slate-600">Real results from real students</p>
            <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-6 w-6 fill-amber-400 text-amber-400" />
                ))}
            </div>
            <span className="text-lg font-semibold text-slate-900">4.9/5</span>
            <span className="text-slate-500">(2,345 reviews)</span>
            </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
            {/* Review Card 1 - Gradient Background */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                </div>
                <p className="text-white/90 mb-4 leading-relaxed">
                "This course is actually fun! I went from dreading SAT prep to looking forward to my study sessions.
                My score jumped 280 points!"
                </p>
                <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-white/20 text-white font-semibold">A</AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold">Alex Chen</h4>
                    <p className="text-white/70 text-sm">Class of 2024</p>
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Review Card 2 - Clean White */}
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                "The practice tests are so realistic! I felt super prepared on test day. The explanations helped me
                understand my mistakes."
                </p>
                <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white font-semibold">
                    S
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold text-slate-900">Sarah Williams</h4>
                    <p className="text-slate-500 text-sm">Scored 1520</p>
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Review Card 3 - Colored Border */}
            <Card className="border-2 border-gradient-to-r from-green-400 to-blue-500 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                "The community support is amazing! Having other students to study with made all the difference.
                Highly recommend!"
                </p>
                <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-semibold">
                    M
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold text-slate-900">Marcus Johnson</h4>
                    <p className="text-slate-500 text-sm">Improved 320 points</p>
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Review Card 4 - Subtle Gradient Background */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                "Best investment I made for college prep. The instructors actually care and the lessons are easy to
                follow."
                </p>
                <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                    E
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold text-slate-900">Emma Rodriguez</h4>
                    <p className="text-slate-500 text-sm">Got into dream school</p>
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Review Card 5 - Dark Theme */}
            <Card className="border-0 shadow-lg bg-slate-800 text-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                </div>
                <p className="text-slate-200 mb-4 leading-relaxed">
                "Finally, SAT prep that doesn't bore me to death! The interactive lessons kept me engaged
                throughout."
                </p>
                <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                    D
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold">David Kim</h4>
                    <p className="text-slate-400 text-sm">Perfect Math Score</p>
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Review Card 6 - Accent Border */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                "The progress tracking feature is incredible. Seeing my improvement motivated me to keep going!"
                </p>
                <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold">
                    L
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold text-slate-900">Lisa Thompson</h4>
                    <p className="text-slate-500 text-sm">1480 SAT Score</p>
                </div>
                </div>
            </CardContent>
            </Card>
        </div>
        
        </div>
    </motion.div>
  )
}

export default ReviewsSection
