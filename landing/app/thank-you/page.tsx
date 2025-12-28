'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AnimatedOrb from '@/components/AnimatedOrb';
import { useTheme } from '@/context/ThemeContext';

export default function ThankYouPage() {
  const { colors } = useTheme();
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)],
    }));
    setConfetti(particles);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Confetti */}
      {confetti.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: -20,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: '100vh',
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: particle.delay,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
      ))}

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Celebration Orb */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring', damping: 15 }}
        >
          <AnimatedOrb size={180} level={5} />
        </motion.div>

        {/* Checkmark Badge */}
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ color: colors.text }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          You're on the list!
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-lg md:text-xl mb-8"
          style={{ color: colors.textSecondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Thanks for joining the LockIn waitlist. We've sent you a confirmation email.
          We'll notify you as soon as LockIn is ready!
        </motion.p>

        {/* What's next card */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text }}
          >
            What happens next?
          </h3>
          <ul className="space-y-3">
            {[
              { icon: '📧', text: 'Check your email for confirmation' },
              { icon: '🔔', text: "We'll notify you when we launch" },
              { icon: '🎁', text: 'Early access members get special perks' },
            ].map((item, index) => (
              <motion.li
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
              >
                <span className="text-xl">{item.icon}</span>
                <span style={{ color: colors.textSecondary }}>{item.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Back to home button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:opacity-80"
            style={{
              backgroundColor: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </motion.div>

        {/* Share section */}
        <motion.div
          className="mt-12 pt-8 border-t"
          style={{ borderColor: colors.border }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <p
            className="text-sm mb-4"
            style={{ color: colors.textSecondary }}
          >
            Spread the word
          </p>
          <div className="flex justify-center gap-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I just joined the LockIn waitlist! Take control of your screen time with smart app blocking and focus sessions. Join me: ")}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl transition-all hover:scale-110"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <svg className="w-5 h-5" style={{ color: colors.text }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&title=${encodeURIComponent("LockIn - Take Control of Your Screen Time")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl transition-all hover:scale-110"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <svg className="w-5 h-5" style={{ color: colors.text }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
