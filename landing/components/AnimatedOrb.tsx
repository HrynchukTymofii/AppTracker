'use client';

import { motion } from 'framer-motion';
import { ORB_THEMES, MONOCHROME_THEMES } from '@/lib/constants';

interface AnimatedOrbProps {
  size: number;
  level?: 1 | 2 | 3 | 4 | 5;
  monochrome?: 'white' | 'dark';
  className?: string;
}

const PARTICLE_COUNT = 8;

export default function AnimatedOrb({
  size,
  level = 3,
  monochrome,
  className = '',
}: AnimatedOrbProps) {
  const theme = monochrome
    ? MONOCHROME_THEMES[monochrome]
    : ORB_THEMES[level];

  // Generate particles with unique properties
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360;
    const orbitRadius = size * 0.52 + (i % 3) * 6;
    const particleSize = 3 + (i % 3) * 2;
    const duration = 4 + i * 0.3;

    return {
      id: i,
      angle,
      orbitRadius,
      particleSize,
      duration,
    };
  });

  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Inject keyframe styles */}
      <style jsx global>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes orbGlow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        @keyframes rotateClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateCounterClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes particleTwinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Floating container */}
      <div
        style={{
          position: 'absolute',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'orbFloat 6s ease-in-out infinite',
        }}
      >
        {/* Outer glow */}
        <div
          style={{
            position: 'absolute',
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: '50%',
            backgroundColor: theme.glow,
            filter: 'blur(40px)',
            animation: 'orbGlow 3s ease-in-out infinite',
          }}
        />

        {/* Energy ring pulse */}
        <div
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `2px solid ${theme.glow}`,
            animation: 'ringPulse 2s ease-out infinite',
          }}
        />

        {/* Second energy ring (delayed) */}
        <div
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid ${theme.glow}`,
            animation: 'ringPulse 2s ease-out infinite',
            animationDelay: '1s',
          }}
        />

        {/* Outer layer - slowest rotation (18s) */}
        <div
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            animation: 'rotateClockwise 18s linear infinite',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `conic-gradient(from 0deg, ${theme.outer[0]}, ${theme.outer[1]}, ${theme.outer[2]}, ${theme.outer[0]})`,
              animation: 'orbPulse 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Middle layer - reverse rotation (12s) */}
        <div
          style={{
            position: 'absolute',
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: '50%',
            overflow: 'hidden',
            animation: 'rotateCounterClockwise 12s linear infinite',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `conic-gradient(from 45deg, ${theme.mid[0]}, ${theme.mid[1]}, ${theme.mid[2]}, ${theme.mid[0]})`,
              animation: 'orbPulse 4s ease-in-out infinite',
              animationDelay: '0.5s',
            }}
          />
        </div>

        {/* Inner layer - faster rotation (8s) */}
        <div
          style={{
            position: 'absolute',
            width: size * 0.58,
            height: size * 0.58,
            borderRadius: '50%',
            overflow: 'hidden',
            animation: 'rotateClockwise 8s linear infinite',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `conic-gradient(from 90deg, ${theme.core[0]}, ${theme.core[1]}, ${theme.core[2]}, ${theme.core[0]})`,
              animation: 'orbPulse 4s ease-in-out infinite',
              animationDelay: '1s',
            }}
          />
        </div>

        {/* Core - bright center with slow rotation (25s) */}
        <div
          style={{
            position: 'absolute',
            width: size * 0.38,
            height: size * 0.38,
            borderRadius: '50%',
            overflow: 'hidden',
            animation: 'rotateCounterClockwise 25s linear infinite',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `radial-gradient(circle at 30% 30%, #ffffff, ${theme.core[0]}, ${theme.core[1]})`,
              animation: 'orbPulse 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Bright spot highlight */}
        <div
          style={{
            position: 'absolute',
            width: size * 0.15,
            height: size * 0.15,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0))',
            top: size * 0.28,
            left: size * 0.28,
            animation: 'orbGlow 2s ease-in-out infinite',
          }}
        />

        {/* Orbiting particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              animation: `rotateClockwise ${particle.duration}s linear infinite`,
              animationDelay: `${particle.id * 0.15}s`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: particle.particleSize,
                height: particle.particleSize,
                borderRadius: '50%',
                backgroundColor: theme.particles,
                boxShadow: `0 0 ${particle.particleSize * 2}px ${theme.glow}`,
                left: '50%',
                top: '50%',
                marginLeft: -particle.particleSize / 2,
                marginTop: -particle.particleSize / 2,
                transform: `translateX(${particle.orbitRadius}px)`,
                animation: `particleTwinkle ${1.5 + (particle.id % 3) * 0.5}s ease-in-out infinite`,
                animationDelay: `${particle.id * 0.2}s`,
              }}
            />
          </div>
        ))}

        {/* Shimmer overlay */}
        <div
          style={{
            position: 'absolute',
            width: size * 0.5,
            height: size * 0.12,
            borderRadius: size * 0.06,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            top: size * 0.22,
            left: size * 0.25,
            transform: 'rotate(-25deg)',
            animation: 'orbGlow 2.5s ease-in-out infinite',
            animationDelay: '0.5s',
          }}
        />
      </div>
    </motion.div>
  );
}
