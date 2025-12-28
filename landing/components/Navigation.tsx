'use client';

import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export default function Navigation() {
  const { colors } = useTheme();

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            }}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span
            className="text-xl font-bold"
            style={{ color: colors.text }}
          >
            LockIn
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
}
