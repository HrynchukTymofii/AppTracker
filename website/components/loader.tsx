"use client"

interface LoaderProps {
  className?: string
  text?: string
}

export function Loader({ className = "", text = "Loading..." }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="spinner-container">
        <div className="spinner">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="loading-text">{text}</div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <style jsx>{`
        .spinner-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 80px;
          height: 80px;
          animation: spinner 2s infinite ease-in-out;
          transform-style: preserve-3d;
          position: relative;
          z-index: 2;
        }

        .spinner > div {
          height: 100%;
          position: absolute;
          width: 100%;
          border: 2px solid transparent;
          background: linear-gradient(135deg, 
            rgba(249, 115, 22, 0.9) 0%,
            rgba(139, 92, 246, 0.9) 25%,
            rgba(59, 130, 246, 0.9) 50%,
            rgba(16, 185, 129, 0.9) 75%,
            rgba(249, 115, 22, 0.9) 100%
          );
          backdrop-filter: blur(10px);
          box-shadow: 
            0 0 20px rgba(249, 115, 22, 0.4),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .spinner div:nth-of-type(1) {
          transform: translateZ(-40px) rotateY(180deg);
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.8), rgba(139, 92, 246, 0.8));
        }

        .spinner div:nth-of-type(2) {
          transform: rotateY(-270deg) translateX(50%);
          transform-origin: top right;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(59, 130, 246, 0.8));
        }

        .spinner div:nth-of-type(3) {
          transform: rotateY(270deg) translateX(-50%);
          transform-origin: center left;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(16, 185, 129, 0.8));
        }

        .spinner div:nth-of-type(4) {
          transform: rotateX(90deg) translateY(-50%);
          transform-origin: top center;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(245, 158, 11, 0.8));
        }

        .spinner div:nth-of-type(5) {
          transform: rotateX(-90deg) translateY(50%);
          transform-origin: bottom center;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.8), rgba(239, 68, 68, 0.8));
        }

        .spinner div:nth-of-type(6) {
          transform: translateZ(40px);
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(249, 115, 22, 0.8));
        }

        .loading-text {
          font-size: 1.125rem;
          font-weight: 600;
          background: linear-gradient(135deg, #f97316, #8b5cf6, #3b82f6);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
          text-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
        }

        .loading-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #8b5cf6);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: 0s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes spinner {
          0% {
            transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
          }
          25% {
            transform: rotate(135deg) rotateX(-25deg) rotateY(115deg);
          }
          50% {
            transform: rotate(225deg) rotateX(-205deg) rotateY(115deg);
          }
          75% {
            transform: rotate(315deg) rotateX(-205deg) rotateY(205deg);
          }
          100% {
            transform: rotate(405deg) rotateX(-385deg) rotateY(295deg);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
