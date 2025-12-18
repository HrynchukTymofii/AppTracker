"use client"

import { RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorPageProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryText?: string
  showHomeButton?: boolean
  onHome?: () => void
  className?: string
}

export function ErrorPage({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again or contact support if the problem persists.",
  onRetry,
  retryText = "Try Again",
  showHomeButton = true,
  onHome,
  className = "",
}: ErrorPageProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      // Default behavior: reload the page
      window.location.reload()
    }
  }

  const handleHome = () => {
    if (onHome) {
      onHome()
    } else {
      // Default behavior: navigate to home
      window.location.href = "/"
    }
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 ${className}`}
    >
      <div className="max-w-md w-full text-center">
        {/* Animated Error SVG */}
        <div className="mb-8 relative">
          <div className="error-illustration">
            <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Background circle with gradient */}
              <defs>
                <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e5e7eb" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
              </defs>

              {/* Floating clouds */}
              <g className="clouds">
                <ellipse cx="60" cy="80" rx="25" ry="15" fill="url(#cloudGradient)" opacity="0.6" />
                <ellipse cx="140" cy="60" rx="20" ry="12" fill="url(#cloudGradient)" opacity="0.4" />
                <ellipse cx="160" cy="120" rx="15" ry="10" fill="url(#cloudGradient)" opacity="0.5" />
              </g>

              {/* Main error symbol */}
              <circle cx="100" cy="100" r="60" fill="url(#errorGradient)" className="error-circle" />

              {/* Exclamation mark */}
              <g className="exclamation">
                <rect x="95" y="75" width="10" height="35" rx="5" fill="white" />
                <circle cx="100" cy="125" r="6" fill="white" />
              </g>

              {/* Glitch lines */}
              <g className="glitch-lines" opacity="0.7">
                <rect x="40" y="95" width="30" height="2" fill="#ef4444" />
                <rect x="130" y="105" width="25" height="2" fill="#ef4444" />
                <rect x="45" y="110" width="20" height="2" fill="#f97316" />
              </g>
            </svg>
          </div>

          {/* Floating particles */}
          <div className="particles">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${20 + i * 15}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Error Content */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleRetry}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryText}
          </Button>

          {showHomeButton && (
            <Button
              onClick={handleHome}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-3 rounded-lg transition-all duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>

        {/* Additional Help */}
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Error Code: ERR_UNEXPECTED</p>
          <p className="mt-1">
            Need help?{" "}
            <a href="/support" className="text-orange-500 hover:text-orange-600 underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .error-illustration {
          position: relative;
          animation: float 3s ease-in-out infinite;
        }

        .error-circle {
          animation: pulse 2s ease-in-out infinite;
        }

        .exclamation {
          animation: shake 0.5s ease-in-out infinite alternate;
        }

        .clouds {
          animation: drift 8s ease-in-out infinite;
        }

        .glitch-lines {
          animation: glitch 2s ease-in-out infinite;
        }

        .particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: linear-gradient(45deg, #f97316, #ef4444);
          border-radius: 50%;
          animation: float-particle 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(2px);
          }
        }

        @keyframes drift {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(10px);
          }
        }

        @keyframes glitch {
          0%, 100% {
            opacity: 0.7;
            transform: translateX(0);
          }
          25% {
            opacity: 1;
            transform: translateX(2px);
          }
          75% {
            opacity: 0.5;
            transform: translateX(-2px);
          }
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
          75% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  )
}
