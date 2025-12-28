import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          green: '#10b981',
          orange: '#f59e0b',
          pink: '#ec4899',
          red: '#ef4444',
          teal: '#14b8a6',
          indigo: '#6366f1',
        },
      },
      animation: {
        'orb-float': 'orbFloat 8s ease-in-out infinite',
        'orb-pulse': 'orbPulse 4s ease-in-out infinite',
        'orb-glow': 'orbGlow 3s ease-in-out infinite',
        'orb-rotate-slow': 'orbRotate 20s linear infinite',
        'orb-rotate-8': 'orbRotate 8s linear infinite',
        'orb-rotate-12': 'orbRotateReverse 12s linear infinite',
        'orb-rotate-15': 'orbRotate 15s linear infinite',
        'ring-pulse': 'ringPulse 2s ease-out infinite',
        'particle-orbit': 'particleOrbit 5s linear infinite',
        'particle-twinkle': 'particleTwinkle 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        orbFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-8px)' },
          '75%': { transform: 'translateY(8px)' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        orbGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        orbRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        orbRotateReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        ringPulse: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(1.3)', opacity: '0' },
        },
        particleOrbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        particleTwinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
