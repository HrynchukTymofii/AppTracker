'use client';

import { motion } from 'framer-motion';
import AnimatedOrb from './AnimatedOrb';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface HeroProps {
  onJoinWaitlist: () => void;
}

export default function Hero({ onJoinWaitlist }: HeroProps) {
  const { colors, colorScheme } = useTheme();
  const { t } = useLanguage();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-blue-500">
            {t('hero.badge')}
          </span>
        </motion.div>

        {/* Orb */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <AnimatedOrb size={200} level={3} />
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          style={{ color: colors.text }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {t('hero.title')}{' '}
          <span className="text-gradient">{t('hero.titleHighlight')}</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
          style={{ color: colors.textSecondary }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {t('hero.description')}
        </motion.p>

        {/* CTA Button with pulse animation */}
        <motion.button
          className="btn-gradient text-lg relative"
          onClick={onJoinWaitlist}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Pulse ring effect */}
          <motion.span
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            }}
            animate={{
              scale: [1, 1.15, 1.15],
              opacity: [0.5, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <span className="relative z-10">{t('hero.cta')}</span>
        </motion.button>

        {/* Social proof */}
        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient">1,000+</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              {t('hero.stats.waitlist')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient">3+ hrs</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              {t('hero.stats.saved')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient">92%</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              {t('hero.stats.goals')}
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
