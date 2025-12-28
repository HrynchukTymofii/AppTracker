'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { DEVICE_OPTIONS, SCREEN_TIME_OPTIONS } from '@/lib/constants';
import AnimatedOrb from './AnimatedOrb';

interface FormData {
  deviceOS: string[];
  name: string;
  preferNotToSay: boolean;
  email: string;
  dailyScreenTime: string;
}

interface QuestionnaireProps {
  onClose: () => void;
  onComplete: (data: FormData) => Promise<void>;
}

const TOTAL_STEPS = 6;

// Helper to get hours from screen time option
const getHoursFromOption = (option: string): number => {
  const hourMap: Record<string, number> = {
    '1-2h': 1.5,
    '2-4h': 3,
    '4-6h': 5,
    '6-8h': 7,
    '8+h': 9,
  };
  return hourMap[option] || 4;
};

// Animated counter component
function AnimatedCounter({ value, duration = 2000, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function Questionnaire({ onClose, onComplete }: QuestionnaireProps) {
  const { colors, colorScheme } = useTheme();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    deviceOS: [],
    name: '',
    preferNotToSay: false,
    email: '',
    dailyScreenTime: '',
  });

  // Calculate time stats based on screen time selection
  const dailyHours = getHoursFromOption(formData.dailyScreenTime);
  const daysPerYear = Math.round((dailyHours * 365) / 24);
  const yearsInLifetime = Math.round((dailyHours * 365 * 50) / (24 * 365) * 10) / 10;
  const savedHoursPerWeek = Math.round(dailyHours * 0.5 * 7);
  const savedYearsLifetime = Math.round(yearsInLifetime * 0.5 * 10) / 10;

  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const toggleDevice = (device: string) => {
    setFormData(prev => ({
      ...prev,
      deviceOS: prev.deviceOS.includes(device)
        ? prev.deviceOS.filter(d => d !== device)
        : [...prev.deviceOS, device],
    }));
    setError('');
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.deviceOS.length > 0;
      case 2:
        return formData.preferNotToSay || formData.name.trim().length > 0;
      case 3:
        return formData.dailyScreenTime !== '';
      case 4: // Bad news - just continue
        return true;
      case 5: // Good news - just continue
        return true;
      case 6:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) {
      setError(t('questionnaire.error'));
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onComplete(formData);
      } catch (err) {
        setError(t('questionnaire.submitError'));
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  // Get translated device label
  const getDeviceLabel = (value: string) => {
    const key = value.toLowerCase() as 'android' | 'ios' | 'macos';
    return t(`devices.${key}`);
  };

  // Get translated screen time option
  const getScreenTimeLabel = (value: string) => {
    return t(`screenTime.${value}.label`);
  };

  const getScreenTimeDesc = (value: string) => {
    return t(`screenTime.${value}.desc`);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-lg glass-card rounded-3xl p-8 overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-colors z-10"
          style={{
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.1)',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="mb-8 mr-10">
          <div className="flex justify-between text-sm mb-2" style={{ color: colors.textSecondary }}>
            <span>{t('questionnaire.step', { current: step, total: TOTAL_STEPS })}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.1)',
            }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait" custom={step}>
          <motion.div
            key={step}
            custom={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Step 1: Device OS */}
            {step === 1 && (
              <div>
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  {t('questionnaire.step1.title')}
                </h3>
                <p className="mb-6" style={{ color: colors.textSecondary }}>
                  {t('questionnaire.step1.subtitle')}
                </p>
                <div className="space-y-3">
                  {DEVICE_OPTIONS.map(device => (
                    <button
                      key={device.value}
                      onClick={() => toggleDevice(device.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all`}
                      style={{
                        borderColor: formData.deviceOS.includes(device.value)
                          ? '#3b82f6'
                          : colors.border,
                        backgroundColor: formData.deviceOS.includes(device.value)
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'transparent',
                      }}
                    >
                      <span className="text-2xl">{device.icon}</span>
                      <span className="font-medium" style={{ color: colors.text }}>
                        {getDeviceLabel(device.value)}
                      </span>
                      <div className="ml-auto">
                        <input
                          type="checkbox"
                          checked={formData.deviceOS.includes(device.value)}
                          onChange={() => {}}
                          className="pointer-events-none"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Name */}
            {step === 2 && (
              <div>
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  {t('questionnaire.step2.title')}
                </h3>
                <p className="mb-6" style={{ color: colors.textSecondary }}>
                  {t('questionnaire.step2.subtitle')}
                </p>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateFormData('name', e.target.value)}
                  disabled={formData.preferNotToSay}
                  placeholder={t('questionnaire.step2.placeholder')}
                  className="w-full p-4 rounded-xl border bg-transparent mb-4 transition-colors disabled:opacity-50"
                  style={{
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.preferNotToSay}
                    onChange={e => {
                      updateFormData('preferNotToSay', e.target.checked);
                      if (e.target.checked) {
                        updateFormData('name', '');
                      }
                    }}
                  />
                  <span style={{ color: colors.textSecondary }}>
                    {t('questionnaire.step2.preferNotToSay')}
                  </span>
                </label>
              </div>
            )}

            {/* Step 3: Screen Time */}
            {step === 3 && (
              <div>
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  {t('questionnaire.step3.title')}
                </h3>
                <p className="mb-6" style={{ color: colors.textSecondary }}>
                  {t('questionnaire.step3.subtitle')}
                </p>
                <div className="space-y-3">
                  {SCREEN_TIME_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateFormData('dailyScreenTime', option.value)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all`}
                      style={{
                        borderColor: formData.dailyScreenTime === option.value
                          ? '#3b82f6'
                          : colors.border,
                        backgroundColor: formData.dailyScreenTime === option.value
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'transparent',
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium" style={{ color: colors.text }}>
                          {getScreenTimeLabel(option.value)}
                        </div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          {getScreenTimeDesc(option.value)}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all`}
                        style={{
                          borderColor: formData.dailyScreenTime === option.value
                            ? '#3b82f6'
                            : colors.border,
                        }}
                      >
                        {formData.dailyScreenTime === option.value && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Bad News - Time Wasted */}
            {step === 4 && (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <AnimatedOrb size={100} level={1} />
                </div>
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ color: colors.text }}
                >
                  {formData.name && !formData.preferNotToSay
                    ? t('questionnaire.step4.titlePersonalized', { name: formData.name })
                    : t('questionnaire.step4.title')}
                </h3>

                <div className="space-y-4 mb-6">
                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <div className="text-4xl font-bold text-red-500 mb-1">
                      <AnimatedCounter value={daysPerYear} suffix={` ${t('questionnaire.step4.days')}`} />
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('questionnaire.step4.daysPerYear')}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <div className="text-4xl font-bold text-red-500 mb-1">
                      {yearsInLifetime < 2 ? (
                        <span>{yearsInLifetime.toFixed(1)} {t('questionnaire.step4.years')}</span>
                      ) : (
                        <>
                          <AnimatedCounter value={Math.floor(yearsInLifetime)} duration={2500} suffix="" />
                          <span className="text-2xl">.{Math.round((yearsInLifetime % 1) * 10)} {t('questionnaire.step4.years')}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('questionnaire.step4.yearsOfLife')}
                    </div>
                  </div>
                </div>

                <p style={{ color: colors.textSecondary }}>
                  {t('questionnaire.step4.hoursEveryYear', { hours: Math.round(dailyHours * 365).toLocaleString() })}
                </p>
              </div>
            )}

            {/* Step 5: Good News - Time Saved */}
            {step === 5 && (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <AnimatedOrb size={100} level={4} />
                </div>
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ color: colors.text }}
                >
                  {formData.name && !formData.preferNotToSay
                    ? t('questionnaire.step5.titlePersonalized', { name: formData.name })
                    : t('questionnaire.step5.title')}
                </h3>
                <p className="mb-6" style={{ color: colors.textSecondary }}>
                  {t('questionnaire.step5.subtitle')}
                </p>

                <div className="space-y-4 mb-6">
                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <div className="text-4xl font-bold text-emerald-500 mb-1">
                      +<AnimatedCounter value={savedHoursPerWeek} suffix={` ${t('questionnaire.step5.hrs')}`} />
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('questionnaire.step5.freeTime')}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <div className="text-4xl font-bold text-emerald-500 mb-1">
                      {savedYearsLifetime < 2 ? (
                        <span>+{savedYearsLifetime.toFixed(1)} {t('questionnaire.step5.years')}</span>
                      ) : (
                        <>
                          +<AnimatedCounter value={Math.floor(savedYearsLifetime)} duration={2500} suffix="" />
                          <span className="text-2xl">.{Math.round((savedYearsLifetime % 1) * 10)} {t('questionnaire.step5.years')}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {t('questionnaire.step5.lifeReclaimed')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: colors.textSecondary }}>
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> {t('questionnaire.step5.productivity')}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> {t('questionnaire.step5.sleep')}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> {t('questionnaire.step5.connections')}
                  </span>
                </div>
              </div>
            )}

            {/* Step 6: Email (Last) */}
            {step === 6 && (
              <div>
                <div className="flex justify-center mb-6">
                  <AnimatedOrb size={80} level={5} />
                </div>
                <h3
                  className="text-2xl font-bold mb-2 text-center"
                  style={{ color: colors.text }}
                >
                  {formData.name && !formData.preferNotToSay
                    ? t('questionnaire.step6.titlePersonalized', { name: formData.name })
                    : t('questionnaire.step6.title')}
                </h3>
                <p className="mb-6 text-center" style={{ color: colors.textSecondary }}>
                  {t('questionnaire.step6.subtitle')}
                </p>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => updateFormData('email', e.target.value)}
                  placeholder={t('questionnaire.step6.placeholder')}
                  className="w-full p-4 rounded-xl border bg-transparent transition-colors"
                  style={{
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                <p className="mt-4 text-sm text-center" style={{ color: colors.textSecondary }}>
                  {t('questionnaire.step6.note')}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <motion.p
            className="text-red-500 text-sm mt-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-4 rounded-xl border transition-colors font-medium"
              style={{
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              {t('questionnaire.back')}
            </button>
          )}
          <motion.button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={canProceed() && !isSubmitting ? { scale: 1.02 } : {}}
            whileTap={canProceed() && !isSubmitting ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('questionnaire.joining')}
              </span>
            ) : step === 4 ? (
              t('questionnaire.showSolution')
            ) : step === 5 ? (
              t('questionnaire.wantToJoin')
            ) : step === TOTAL_STEPS ? (
              t('questionnaire.joinWaitlist')
            ) : (
              t('questionnaire.continue')
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
