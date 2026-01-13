import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  AppState,
  Dimensions,
  Platform,
  Animated,
  StyleSheet,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ChevronRight,
  Shield,
  Target,
  CheckCircle,
  Info,
  Smartphone,
  Globe,
  Search,
  Check,
  Star,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import {
  hasUsageStatsPermission,
  openUsageStatsSettings,
  getInstalledApps,
  InstalledApp,
} from '@/modules/usage-stats';
import {
  hasOverlayPermission,
  openOverlaySettings,
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
} from '@/modules/app-blocker';
import {
  getDailyUsageForWeek as getDailyUsageForWeekTracking,
  getTodayUsageStats as getTodayStatsTracking,
} from '@/lib/usageTracking';
import Purchases from 'react-native-purchases';

import { COLORS, GRADIENT_COLORS, useOnboardingTheme } from './designSystem';
import { AnimatedCounter, FadeInView } from './AnimatedComponents';
import { GlassCard, GradientButton, GradientBarChart, VideoPlaceholder } from './UIComponents';
import AnimatedOrb from '@/components/AnimatedOrb';
import {
  LearnMoreModal,
  AccessibilityReassuranceModal,
  DeclineWarningModal,
  PaywallModal,
} from './Modals';
import {
  UserAnswers,
  SOCIAL_MEDIA_APPS,
  POPULAR_WEBSITES,
  DEFAULT_BLOCKED_APPS,
  DEFAULT_BLOCKED_SITES,
  SOCIAL_PACKAGE_NAMES,
  CURRENT_APP_PACKAGE,
} from './constants';

const { width } = Dimensions.get('window');

// ============================================
// SCREEN 1: Welcome
// ============================================

export const Step1Welcome = ({
  onContinue,
}: {
  onContinue: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{ alignSelf: 'center', marginBottom: 40 }}>
          <AnimatedOrb size={160} level={5} />
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 44,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 16,
          letterSpacing: -1.5,
        }}>
          {t('sellingOnboarding.welcome.hello')}
        </Text>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 24,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 16,
          lineHeight: 32,
          fontWeight: '600',
        }}>
          {t('sellingOnboarding.welcome.welcomeTo')}{' '}
          <Text style={{ color: COLORS.gradientPurple }}>{t('sellingOnboarding.welcome.appName')}</Text>
        </Text>
      </FadeInView>

      <FadeInView delay={300}>
        <GlassCard variant="gradient" style={{ marginBottom: 48, padding: 24 }}>
          <Text style={{
            fontSize: 17,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 26,
          }}>
            {t('sellingOnboarding.welcome.readyToHelp')}{'\n'}
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
              {t('sellingOnboarding.welcome.takingControl')}
            </Text>
          </Text>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={400}>
        <GradientButton onPress={onContinue} title={t('sellingOnboarding.welcome.letsStart')} />
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 2: Age Selection
// ============================================

export const Step2Age = ({
  onSelect,
}: {
  onSelect: (age: number) => void;
}) => {
  const { colors } = useOnboardingTheme();
  const { t } = useTranslation();
  const ageRanges = [
    { age: 16, label: t('sellingOnboarding.age.under18') },
    { age: 21, label: '18-24' },
    { age: 27, label: '25-30' },
    { age: 35, label: '31-40' },
    { age: 45, label: '41-50' },
    { age: 55, label: '51+' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 32,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 12,
          letterSpacing: -0.5,
        }}>
          {t('sellingOnboarding.age.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 36,
        }}>
          {t('sellingOnboarding.age.subtitle')}
        </Text>
      </FadeInView>

      <View style={{ gap: 10 }}>
        {ageRanges.map((item, index) => (
          <FadeInView key={item.age} delay={200 + index * 50}>
            <TouchableOpacity
              onPress={() => onSelect(item.age)}
              activeOpacity={0.7}
            >
              <GlassCard style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}>
                  {item.label}
                </Text>
                <ChevronRight size={20} color={colors.textTertiary} />
              </GlassCard>
            </TouchableOpacity>
          </FadeInView>
        ))}
      </View>
    </ScrollView>
  );
};

// ============================================
// SCREEN 3: Daily Phone Usage
// ============================================

export const Step3Hours = ({
  onSelect,
}: {
  onSelect: (hours: number) => void;
}) => {
  const { colors } = useOnboardingTheme();
  const { t } = useTranslation();
  const options = [
    { hours: 1.5, label: t('sellingOnboarding.hours.range1_2') },
    { hours: 3, label: t('sellingOnboarding.hours.range2_4') },
    { hours: 5, label: t('sellingOnboarding.hours.range4_6') },
    { hours: 7, label: t('sellingOnboarding.hours.range6_8') },
    { hours: 9, label: t('sellingOnboarding.hours.range8plus') },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 32,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 12,
          letterSpacing: -0.5,
        }}>
          {t('sellingOnboarding.hours.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 36,
        }}>
          {t('sellingOnboarding.hours.subtitle')}
        </Text>
      </FadeInView>

      <View style={{ gap: 10 }}>
        {options.map((option, index) => (
          <FadeInView key={option.hours} delay={200 + index * 50}>
            <TouchableOpacity
              onPress={() => onSelect(option.hours)}
              activeOpacity={0.7}
            >
              <GlassCard style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}>
                  {option.label}
                </Text>
                <ChevronRight size={20} color={colors.textTertiary} />
              </GlassCard>
            </TouchableOpacity>
          </FadeInView>
        ))}
      </View>
    </ScrollView>
  );
};

// ============================================
// SCREEN 4: Bad & Good News Intro
// ============================================

export const Step4NewsIntro = ({
  onContinue,
}: {
  onContinue: () => void;
}) => {
  const { colors } = useOnboardingTheme();
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      {/* <FadeInView delay={0}>
        <GlassCard style={{ alignSelf: 'center', marginBottom: 36, padding: 28 }}>
          <Text style={{ fontSize: 56 }}>📊</Text>
        </GlassCard>
      </FadeInView> */}

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 36,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 44,
          letterSpacing: -1,
        }}>
          {t('sellingOnboarding.newsIntro.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={400}>
        <Text style={{
          fontSize: 17,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 56,
          lineHeight: 26,
        }}>
          {t('sellingOnboarding.newsIntro.subtitle')}
        </Text>
      </FadeInView>

      <FadeInView delay={600}>
        <GradientButton onPress={onContinue} title={t('sellingOnboarding.newsIntro.showMe')} shadowDelay={1200} />
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 5: The Bad News
// ============================================

export const Step5BadNews = ({
  userAnswers,
  onContinue,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();
  const hours = userAnswers.dailyHours;
  const daysPerYear = Math.round((hours * 365) / 24);
  const yearsPerLife = Math.round((hours * 365 * 50) / (24 * 365));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: COLORS.error,
          }}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={[StyleSheet.absoluteFill, { height: '60%' }]}
            />
            <View style={{ paddingVertical: 10, paddingHorizontal: 24 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}>
                {t('sellingOnboarding.badNews.label')}
              </Text>
            </View>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 18,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 8,
          lineHeight: 26,
        }}>
          {t('sellingOnboarding.badNews.atHoursPerDay', { hours })}
        </Text>
      </FadeInView>

      <FadeInView delay={400}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <AnimatedCounter
            value={daysPerYear}
            suffix={` ${t('sellingOnboarding.badNews.days')}`}
            duration={2000}
            startDelay={500}
            style={{
              fontSize: 64,
              fontWeight: '800',
              color: COLORS.error,
              letterSpacing: -2,
            }}
          />
          <Text style={{
            fontSize: 17,
            color: colors.textSecondary,
            marginTop: 8,
          }}>
            {t('sellingOnboarding.badNews.onYourPhone')} <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{t('sellingOnboarding.badNews.thisYear')}</Text>
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={800}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{
            fontSize: 16,
            color: colors.textTertiary,
            marginBottom: 4,
          }}>
            {t('sellingOnboarding.badNews.overLifetime')}
          </Text>
          <AnimatedCounter
            value={yearsPerLife}
            suffix={` ${t('sellingOnboarding.badNews.years')}`}
            duration={2000}
            startDelay={1000}
            style={{
              fontSize: 80,
              fontWeight: '800',
              color: COLORS.error,
              letterSpacing: -3,
            }}
          />
          <Text style={{
            fontSize: 18,
            color: colors.textSecondary,
            marginTop: 8,
            fontWeight: '500',
          }}>
            {t('sellingOnboarding.badNews.lifeGone')}
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={1200}>
        <View style={{
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 40,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
        }}>
          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={isDark ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={isDark ? ['rgba(255, 255, 255, 0.06)', 'transparent'] : ['rgba(255, 255, 255, 0.4)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={[StyleSheet.absoluteFill, { height: '60%' }]}
          />
          <View style={{ padding: 20 }}>
            <Text style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
            }}>
              {t('sellingOnboarding.badNews.timeYouCouldSpend')}
            </Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={1400}>
        <GradientButton
          onPress={onContinue}
          title={t('sellingOnboarding.badNews.whatsGoodNews')}
          shadowDelay={2100}
        />
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 6: The Good News
// ============================================

export const Step6GoodNews = ({
  userAnswers,
  onContinue,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
}) => {
  const { colors } = useOnboardingTheme();
  const { t } = useTranslation();
  const hours = userAnswers.dailyHours;
  const savedYears = Math.round((hours * 0.6 * 365 * 50) / (24 * 365));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: COLORS.success,
          }}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={[StyleSheet.absoluteFill, { height: '60%' }]}
            />
            <View style={{ paddingVertical: 10, paddingHorizontal: 24 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}>
                {t('sellingOnboarding.goodNews.label')}
              </Text>
            </View>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 22,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 0,
          lineHeight: 30,
          fontWeight: '500',
        }}>
          {t('sellingOnboarding.goodNews.canHelpYouGetBack')}
        </Text>
      </FadeInView>

      <FadeInView delay={400}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <AnimatedCounter
            value={savedYears}
            prefix="+"
            suffix={` ${t('sellingOnboarding.goodNews.years')}`}
            duration={2000}
            startDelay={500}
            style={{
              fontSize: 80,
              fontWeight: '800',
              color: COLORS.success,
              letterSpacing: -4,
            }}
          />
          <Text style={{
            fontSize: 18,
            color: colors.textSecondary,
            marginTop: 8,
            textAlign: 'center',
          }}>
            {t('sellingOnboarding.goodNews.ofYourLife')}
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={800}>
        <Text style={{
          fontSize: 17,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 48,
          lineHeight: 28,
        }}>
          {t('sellingOnboarding.goodNews.turnIntoThings')}{'\n\n'}
          {t('sellingOnboarding.goodNews.moreTimeFor')}
        </Text>
      </FadeInView>

      <FadeInView delay={1000}>
        <GradientButton
          onPress={onContinue}
          title={t('sellingOnboarding.goodNews.letsGetStarted')}
          colors={GRADIENT_COLORS.success}
          shadowDelay={1700}
        />
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 7: First Step Intro
// ============================================

export const Step7FirstStep = ({
  onContinue,
}: {
  onContinue: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();

  const features = [
    t('sellingOnboarding.firstStep.feature1'),
    t('sellingOnboarding.firstStep.feature2'),
    t('sellingOnboarding.firstStep.feature3'),
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{ alignSelf: 'center', marginBottom: 20 }}>
          <AnimatedOrb size={120} level={5} />
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 32,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 16,
          letterSpacing: -0.5,
        }}>
          {t('sellingOnboarding.firstStep.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 17,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 26,
        }}>
          {t('sellingOnboarding.firstStep.subtitle')}{' '}
          <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
            {t('sellingOnboarding.firstStep.personalizedReport')}
          </Text>
        </Text>
      </FadeInView>

      <FadeInView delay={300}>
        <GlassCard variant="gradient" style={{ marginBottom: 40, padding: 0 }} noPadding>
          {features.map((text, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: index < features.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: COLORS.success,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text style={{
                fontSize: 15,
                color: colors.textPrimary,
                fontWeight: '500',
                flex: 1,
              }}>
                {text}
              </Text>
            </View>
          ))}
        </GlassCard>
      </FadeInView>

      <FadeInView delay={400}>
        <GradientButton
          onPress={onContinue}
          title={t('sellingOnboarding.firstStep.imReady')}
          colors={GRADIENT_COLORS.success}
        />
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 8: Screen Time Permission
// ============================================

export const Step8ScreenTimePermission = ({
  onGranted,
  onSkip,
}: {
  onGranted: (realHours: number) => void;
  onSkip: () => void;
}) => {
  const { colors } = useOnboardingTheme();
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Video player for the permission tutorial
  const videoPlayer = useVideoPlayer(
    require('@/assets/videos/onboarding/Usage-sats-access-video.mp4'),
    player => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  useEffect(() => {
    // iOS doesn't have this permission - auto skip
    if (Platform.OS === 'ios') {
      setTimeout(() => onGranted(4), 300); // Default to 4 hours on iOS
      return;
    }
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === 'ios') return;
    const granted = await hasUsageStatsPermission();
    setHasPermission(granted);
    if (granted) {
      await fetchRealData();
    }
  };

  const fetchRealData = async () => {
    try {
      const stats = await getTodayStatsTracking();
      const realHours = Math.round(stats.totalScreenTime / 1000 / 60 / 60 * 10) / 10;
      onGranted(realHours);
    } catch (e) {
      onGranted(0);
    }
  };

  const handleGrantPermission = async () => {
    if (Platform.OS === 'ios') {
      onGranted(4);
      return;
    }
    setIsChecking(true);
    openUsageStatsSettings();
  };

  useEffect(() => {
    if (Platform.OS === 'ios') return;
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && isChecking) {
        // Add delay and retry logic - Android needs time to propagate permission changes
        const checkWithRetry = async (retries: number, delay: number): Promise<boolean> => {
          for (let i = 0; i < retries; i++) {
            await new Promise(resolve => setTimeout(resolve, delay));
            const granted = await hasUsageStatsPermission();
            if (granted) return true;
          }
          return false;
        };

        const granted = await checkWithRetry(5, 500); // Check 5 times with 500ms delay
        if (granted) {
          setHasPermission(true);
          await fetchRealData();
        }
        setIsChecking(false);
      }
    });
    return () => subscription.remove();
  }, [isChecking]);

  const learnMoreFeatures = [
    { icon: '📊', title: t('sellingOnboarding.screenTimePermission.learnMore.trackUsage'), description: t('sellingOnboarding.screenTimePermission.learnMore.trackUsageDesc') },
    { icon: '📈', title: t('sellingOnboarding.screenTimePermission.learnMore.monitorProgress'), description: t('sellingOnboarding.screenTimePermission.learnMore.monitorProgressDesc') },
    { icon: '🎯', title: t('sellingOnboarding.screenTimePermission.learnMore.personalizedInsights'), description: t('sellingOnboarding.screenTimePermission.learnMore.personalizedInsightsDesc') },
    { icon: '🔔', title: t('sellingOnboarding.screenTimePermission.learnMore.smartAlerts'), description: t('sellingOnboarding.screenTimePermission.learnMore.smartAlertsDesc') },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      <LearnMoreModal
        visible={showLearnMore}
        onClose={() => setShowLearnMore(false)}
        title={t('sellingOnboarding.screenTimePermission.whyWeNeedThis')}
        features={learnMoreFeatures}
      />

      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 12,
          letterSpacing: -0.5,
        }}>
          {t('sellingOnboarding.screenTimePermission.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <GlassCard variant="light" style={{ marginBottom: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Shield size={20} color={COLORS.success} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: COLORS.success, flex: 1, fontWeight: '500' }}>
              {t('sellingOnboarding.screenTimePermission.securityNote')}
            </Text>
          </View>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={200}>
        <View style={{
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}>
          <VideoView
            player={videoPlayer}
            style={{
              width: '100%',
              aspectRatio: 4 / 3,
            }}
            contentFit="contain"
            nativeControls={false}
          />
        </View>
      </FadeInView>

      {hasPermission ? (
        <FadeInView delay={300}>
          <GlassCard style={{ alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={36} color={COLORS.success} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.success }}>
              {t('sellingOnboarding.screenTimePermission.permissionGranted')}
            </Text>
          </GlassCard>
        </FadeInView>
      ) : (
        <>
          <FadeInView delay={300}>
            <GlassCard style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: 16,
              }}>
                {t('sellingOnboarding.screenTimePermission.howToEnable')}
              </Text>
              {[t('sellingOnboarding.screenTimePermission.step1'), t('sellingOnboarding.screenTimePermission.step2')].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <LinearGradient
                    colors={GRADIENT_COLORS.primary}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                      {i + 1}
                    </Text>
                  </LinearGradient>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, flex: 1 }}>
                    {step}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </FadeInView>

          <FadeInView delay={400}>
            <GradientButton
              onPress={handleGrantPermission}
              title={isChecking ? t('sellingOnboarding.screenTimePermission.checking') : t('sellingOnboarding.screenTimePermission.continue')}
              colors={GRADIENT_COLORS.success}
              style={{ marginBottom: 12 }}
            />
          </FadeInView>

          <FadeInView delay={500}>
            <TouchableOpacity
              onPress={() => setShowLearnMore(true)}
              style={{
                padding: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Info size={16} color={colors.textTertiary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, color: colors.textTertiary }}>
                {t('sellingOnboarding.screenTimePermission.learnMore.title')}
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
};

// ============================================
// COMMITMENT STEP - Press and Hold with Wild Animations
// ============================================

// Flying emoji component
const FlyingEmoji = ({
  emoji,
  startX,
  startY,
  endX,
  endY,
  delay,
  duration,
  isActive,
}: {
  emoji: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
  isActive: boolean;
}) => {
  const translateX = React.useRef(new Animated.Value(startX)).current;
  const translateY = React.useRef(new Animated.Value(startY)).current;
  const scale = React.useRef(new Animated.Value(0)).current;
  const rotate = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isActive) {
      // Reset positions
      translateX.setValue(startX);
      translateY.setValue(startY);
      scale.setValue(0);
      rotate.setValue(0);
      opacity.setValue(0);

      // Start animation after delay
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: endX,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: endY,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.5,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotate, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: duration * 0.6,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, delay);

      return () => clearTimeout(timeout);
    } else {
      opacity.setValue(0);
    }
  }, [isActive]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        opacity,
        transform: [
          { translateX },
          { translateY },
          { scale },
          { rotate: spin },
        ],
      }}
    >
      <Text style={{ fontSize: 36 }}>{emoji}</Text>
    </Animated.View>
  );
};

export const StepCommitment = ({
  onComplete,
}: {
  onComplete: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const holdDuration = 3000; // 3 seconds
  const progressRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = React.useRef<number>(0);

  // Page-wide animations
  const pageScale = React.useRef(new Animated.Value(1)).current;
  const pageRotate = React.useRef(new Animated.Value(0)).current;
  const orbScale = React.useRef(new Animated.Value(1)).current;
  const orbGlow = React.useRef(new Animated.Value(0)).current;
  const textScale = React.useRef(new Animated.Value(1)).current;
  const shakeX = React.useRef(new Animated.Value(0)).current;

  // Emojis configuration - flying from corners
  const emojis = [
    { emoji: '🎯', startX: -200, startY: -300, endX: 0, endY: 0, delay: 0 },
    { emoji: '💪', startX: 200, startY: -300, endX: 0, endY: 0, delay: 200 },
    { emoji: '🔥', startX: -200, startY: 300, endX: 0, endY: 0, delay: 400 },
    { emoji: '⚡', startX: 200, startY: 300, endX: 0, endY: 0, delay: 600 },
    { emoji: '🚀', startX: 0, startY: -400, endX: 0, endY: 0, delay: 800 },
    { emoji: '✨', startX: -300, startY: 0, endX: 0, endY: 0, delay: 1000 },
    { emoji: '🏆', startX: 300, startY: 0, endX: 0, endY: 0, delay: 1200 },
    { emoji: '💎', startX: 0, startY: 400, endX: 0, endY: 0, delay: 1400 },
    { emoji: '🌟', startX: -250, startY: -200, endX: 0, endY: 0, delay: 1600 },
    { emoji: '🎉', startX: 250, startY: -200, endX: 0, endY: 0, delay: 1800 },
    { emoji: '💫', startX: -250, startY: 200, endX: 0, endY: 0, delay: 2000 },
    { emoji: '🌈', startX: 250, startY: 200, endX: 0, endY: 0, delay: 2200 },
  ];

  // Animation effects while holding
  React.useEffect(() => {
    if (isHolding && !completed) {
      // Page zoom in effect
      Animated.timing(pageScale, {
        toValue: 1.05,
        duration: holdDuration,
        useNativeDriver: true,
      }).start();

      // Orb growing effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, {
            toValue: 1.4,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(orbScale, {
            toValue: 1.1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Orb glow intensity
      Animated.timing(orbGlow, {
        toValue: 1,
        duration: holdDuration,
        useNativeDriver: true,
      }).start();

      // Text pumping
      Animated.loop(
        Animated.sequence([
          Animated.timing(textScale, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(textScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Subtle shake
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeX, {
            toValue: 3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeX, {
            toValue: -3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeX, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (!completed) {
      // Reset animations
      Animated.parallel([
        Animated.spring(pageScale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(orbScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(orbGlow, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.spring(textScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [isHolding, completed]);

  // Completion celebration
  React.useEffect(() => {
    if (completed) {
      // Big burst effect
      Animated.sequence([
        Animated.timing(pageScale, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(pageScale, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(orbScale, {
          toValue: 2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(orbScale, {
          toValue: 1.2,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [completed]);

  const handlePressIn = () => {
    if (completed) return;
    setIsHolding(true);
    startTimeRef.current = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(elapsed / holdDuration, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        if (progressRef.current) {
          clearInterval(progressRef.current);
        }
        setCompleted(true);
        setIsHolding(false);

        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    }, 30);
  };

  const handlePressOut = () => {
    if (completed) return;
    setIsHolding(false);
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    setProgress(0);
  };

  const pageRotation = pageRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg'],
  });

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [
          { scale: pageScale },
          { translateX: shakeX },
        ],
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
        {/* Flying emojis layer */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {emojis.map((item, index) => (
            <FlyingEmoji
              key={index}
              emoji={item.emoji}
              startX={item.startX}
              startY={item.startY}
              endX={item.endX}
              endY={item.endY}
              delay={item.delay}
              duration={800}
              isActive={isHolding || completed}
            />
          ))}
        </View>

        {/* Title */}
        <FadeInView delay={0}>
          <Animated.View style={{ transform: [{ scale: textScale }] }}>
            <Text style={{
              fontSize: 36,
              fontWeight: '800',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 12,
              letterSpacing: -1,
            }}>
              {completed ? t('sellingOnboarding.commitment.committed') : t('sellingOnboarding.commitment.title')}
            </Text>
          </Animated.View>
        </FadeInView>

        <FadeInView delay={100}>
          <Text style={{
            fontSize: 17,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 48,
            lineHeight: 26,
            paddingHorizontal: 20,
          }}>
            {completed
              ? t('sellingOnboarding.commitment.takenFirstStep')
              : t('sellingOnboarding.commitment.pressAndHold')}
          </Text>
        </FadeInView>

        {/* Main interactive area with Orb */}
        <FadeInView delay={200}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            disabled={completed}
            style={{ alignItems: 'center', justifyContent: 'center' }}
          >
            {/* Glow effect behind orb */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                opacity: orbGlow,
                transform: [{ scale: orbScale }],
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: 150,
                backgroundColor: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.15)',
                opacity: orbGlow,
                transform: [{ scale: Animated.multiply(orbScale, 1.2) }],
              }}
            />

            {/* Animated Orb */}
            <Animated.View style={{ transform: [{ scale: orbScale }] }}>
              <AnimatedOrb size={completed ? 200 : 180} level={completed ? 5 : isHolding ? 4 : 3} />
            </Animated.View>

            {/* Progress indicator */}
            {isHolding && !completed && (
              <View style={{
                position: 'absolute',
                bottom: -40,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 48,
                  fontWeight: '800',
                  color: COLORS.gradientPurple,
                }}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </FadeInView>

        {/* Status text */}
        <View style={{ marginTop: 60 }}>
          <Animated.View style={{ transform: [{ scale: textScale }] }}>
            <Text style={{
              fontSize: 18,
              color: completed ? COLORS.success : isHolding ? COLORS.gradientPurple : colors.textTertiary,
              fontWeight: '700',
              textAlign: 'center',
            }}>
              {completed
                ? t('sellingOnboarding.commitment.letsSetUp')
                : isHolding
                ? t('sellingOnboarding.commitment.keepHolding')
                : t('sellingOnboarding.commitment.holdTheOrb')}
            </Text>
          </Animated.View>
        </View>

        {/* Celebration emojis at completion */}
        {completed && (
          <View style={{
            position: 'absolute',
            bottom: 100,
            flexDirection: 'row',
            gap: 20,
          }}>
            {['🎊', '🥳', '🎉', '✨', '💪'].map((emoji, i) => (
              <FadeInView key={i} delay={i * 100}>
                <Text style={{ fontSize: 32 }}>{emoji}</Text>
              </FadeInView>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// Due to file size limits, remaining steps (9-15) are in StepsRemaining.tsx
