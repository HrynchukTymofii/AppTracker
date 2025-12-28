'use client';

import { useTheme } from '@/context/ThemeContext';

export default function Footer() {
  const { colors } = useTheme();

  return (
    <footer className="py-12 px-6 border-t" style={{ borderColor: colors.border }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              }}
            >
              <svg
                className="w-5 h-5 text-white"
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
            <span className="font-semibold" style={{ color: colors.text }}>
              LockIn
            </span>
          </div>

          {/* Copyright */}
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            &copy; {new Date().getFullYear()} LockIn. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm transition-colors animated-underline"
              style={{ color: colors.textSecondary }}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm transition-colors animated-underline"
              style={{ color: colors.textSecondary }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
