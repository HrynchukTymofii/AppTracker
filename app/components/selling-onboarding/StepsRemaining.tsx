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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield,
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
  hasOverlayPermission,
  openOverlaySettings,
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
} from '@/modules/app-blocker';
import {
  getInstalledApps,
  InstalledApp,
} from '@/modules/usage-stats';
import { getDailyUsageForWeek as getDailyUsageForWeekTracking, getTodayUsageStats, formatDuration, type AppUsageData } from '@/lib/usageTracking';
import Purchases from 'react-native-purchases';
import AnimatedOrb from '@/components/AnimatedOrb';
import { Clock, AlertTriangle, Bot, Target, Sparkles, CheckCircle2 } from 'lucide-react-native';

import { COLORS, GRADIENT_COLORS, useOnboardingTheme } from './designSystem';
import { FadeInView } from './AnimatedComponents';
import { GlassCard, GradientButton, GradientBarChart, WhiteGlassButton } from './UIComponents';
import {
  LearnMoreModal,
  AccessibilityReassuranceModal,
  DeclineWarningModal,
  PaywallModal,
} from './Modals';
import {
  UserAnswers,
  POPULAR_WEBSITES,
  DEFAULT_BLOCKED_APPS,
  DEFAULT_BLOCKED_SITES,
  SOCIAL_PACKAGE_NAMES,
  CURRENT_APP_PACKAGE,
} from './constants';

const { width } = Dimensions.get('window');

// ============================================
// SCREEN 9: App Blocking Permission (Overlay)
// ============================================

export const Step9OverlayPermission = ({
  onContinue,
}: {
  onContinue: () => void;
}) => {
  const { colors } = useOnboardingTheme();
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Video player for the overlay permission tutorial
  const videoPlayer = useVideoPlayer(
    require('@/assets/videos/onboarding/Appear-on-top-video.mp4'),
    player => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  useEffect(() => {
    // iOS doesn't have overlay permission - auto skip
    if (Platform.OS === 'ios') {
      setTimeout(() => onContinue(), 300);
      return;
    }
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === 'ios') return;
    const granted = await hasOverlayPermission();
    setHasPermission(granted);
    // Auto-skip if already granted
    if (granted) {
      setTimeout(() => onContinue(), 300);
    }
  };

  const handleGrantPermission = async () => {
    if (Platform.OS === 'ios') {
      onContinue();
      return;
    }
    setIsChecking(true);
    openOverlaySettings();
  };

  useEffect(() => {
    if (Platform.OS === 'ios') return;
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && isChecking) {
        // Add delay and retry logic - Android needs time to propagate permission changes
        const checkWithRetry = async (retries: number, delay: number): Promise<boolean> => {
          for (let i = 0; i < retries; i++) {
            await new Promise(resolve => setTimeout(resolve, delay));
            const granted = await hasOverlayPermission();
            if (granted) return true;
          }
          return false;
        };

        const granted = await checkWithRetry(5, 500); // Check 5 times with 500ms delay
        setHasPermission(granted);
        setIsChecking(false);
      }
    });
    return () => subscription.remove();
  }, [isChecking]);

  const learnMoreFeatures = [
    { icon: '🛡️', title: t('sellingOnboarding.overlay.learnMore.blockApps'), description: t('sellingOnboarding.overlay.learnMore.blockAppsDesc') },
    { icon: '⏰', title: t('sellingOnboarding.overlay.learnMore.breakReminders'), description: t('sellingOnboarding.overlay.learnMore.breakRemindersDesc') },
    { icon: '🎯', title: t('sellingOnboarding.overlay.learnMore.focusSessions'), description: t('sellingOnboarding.overlay.learnMore.focusSessionsDesc') },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      <LearnMoreModal
        visible={showLearnMore}
        onClose={() => setShowLearnMore(false)}
        title={t('sellingOnboarding.overlay.whyWeNeedThis')}
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
          {t('sellingOnboarding.overlay.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <GlassCard variant="light" style={{ marginBottom: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Shield size={20} color={COLORS.success} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: COLORS.success, flex: 1, fontWeight: '500' }}>
              {t('sellingOnboarding.overlay.securityNote')}
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
              {t('sellingOnboarding.overlay.permissionGranted')}
            </Text>
          </GlassCard>
          <GradientButton onPress={onContinue} title={t('sellingOnboarding.overlay.continue')} colors={GRADIENT_COLORS.success} />
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
                {t('sellingOnboarding.overlay.howToEnable')}
              </Text>
              {[t('sellingOnboarding.overlay.step1'), t('sellingOnboarding.overlay.step2')].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <LinearGradient
                    colors={GRADIENT_COLORS.success}
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
              title={isChecking ? t('sellingOnboarding.overlay.checking') : t('sellingOnboarding.overlay.continue')}
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
                {t('sellingOnboarding.overlay.learnMore.title')}
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
};

// ============================================
// SCREEN 10: Accessibility Permission
// ============================================

export const Step10AccessibilityPermission = ({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) => {
  const { colors } = useOnboardingTheme();
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showReassurance, setShowReassurance] = useState(false);
  const [showDeclineWarning, setShowDeclineWarning] = useState(false);

  // Video player for the accessibility permission tutorial
  const videoPlayer = useVideoPlayer(
    require('@/assets/videos/onboarding/Accessebility-access-video.mp4'),
    player => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  useEffect(() => {
    // iOS doesn't have accessibility permission - auto skip
    if (Platform.OS === 'ios') {
      setTimeout(() => onContinue(), 300);
      return;
    }
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === 'ios') return;
    const granted = await isAccessibilityServiceEnabled();
    setHasPermission(granted);
    // Auto-skip if already granted
    if (granted) {
      setTimeout(() => onContinue(), 300);
    }
  };

  const handleGrantPermission = async () => {
    if (Platform.OS === 'ios') {
      onContinue();
      return;
    }
    setShowReassurance(true);
  };

  const handleReassuranceContinue = () => {
    setShowReassurance(false);
    setIsChecking(true);
    openAccessibilitySettings();
  };

  const handleReassuranceDecline = () => {
    setShowReassurance(false);
    setShowDeclineWarning(true);
  };

  const handleDeclineConfirm = () => {
    setShowDeclineWarning(false);
    onSkip();
  };

  const handleDeclineGoBack = () => {
    setShowDeclineWarning(false);
    setShowReassurance(true);
  };

  useEffect(() => {
    if (Platform.OS === 'ios') return;
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && isChecking) {
        // Add delay and retry logic - Android needs time to propagate permission changes
        const checkWithRetry = async (retries: number, delay: number): Promise<boolean> => {
          for (let i = 0; i < retries; i++) {
            await new Promise(resolve => setTimeout(resolve, delay));
            const granted = await isAccessibilityServiceEnabled();
            if (granted) return true;
          }
          return false;
        };

        const granted = await checkWithRetry(5, 500); // Check 5 times with 500ms delay
        setHasPermission(granted);
        setIsChecking(false);
        if (granted) {
          onContinue();
        }
      }
    });
    return () => subscription.remove();
  }, [isChecking]);

  const learnMoreFeatures = [
    { icon: '🔍', title: t('sellingOnboarding.accessibility.learnMore.detectAppOpens'), description: t('sellingOnboarding.accessibility.learnMore.detectAppOpensDesc') },
    { icon: '🛡️', title: t('sellingOnboarding.accessibility.learnMore.instantBlocking'), description: t('sellingOnboarding.accessibility.learnMore.instantBlockingDesc') },
    { icon: '🔒', title: t('sellingOnboarding.accessibility.learnMore.privacyFirst'), description: t('sellingOnboarding.accessibility.learnMore.privacyFirstDesc') },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      <LearnMoreModal
        visible={showLearnMore}
        onClose={() => setShowLearnMore(false)}
        title={t('sellingOnboarding.accessibility.whyWeNeedThis')}
        features={learnMoreFeatures}
      />

      <AccessibilityReassuranceModal
        visible={showReassurance}
        onContinue={handleReassuranceContinue}
        onDecline={handleReassuranceDecline}
      />

      <DeclineWarningModal
        visible={showDeclineWarning}
        onContinue={handleDeclineConfirm}
        onGoBack={handleDeclineGoBack}
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
          {t('sellingOnboarding.accessibility.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <GlassCard variant="light" style={{ marginBottom: 16, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
          <Text style={{
            fontSize: 14,
            color: COLORS.warning,
            textAlign: 'center',
            lineHeight: 20,
          }}>
            {t('sellingOnboarding.accessibility.warningNote')}
          </Text>
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
              aspectRatio: 4 / 5,
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
              {t('sellingOnboarding.accessibility.permissionGranted')}
            </Text>
          </GlassCard>
          <GradientButton onPress={onContinue} title={t('sellingOnboarding.accessibility.continue')} colors={GRADIENT_COLORS.success} />
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
                {t('sellingOnboarding.accessibility.howToEnable')}
              </Text>
              {[t('sellingOnboarding.accessibility.step1'), t('sellingOnboarding.accessibility.step2'), t('sellingOnboarding.accessibility.step3')].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <LinearGradient
                    colors={GRADIENT_COLORS.success}
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
              title={isChecking ? t('sellingOnboarding.accessibility.checking') : t('sellingOnboarding.accessibility.continue')}
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
                {t('sellingOnboarding.accessibility.learnMore.title')}
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
};

// ============================================
// SCREEN 11: Usage Data Display
// ============================================

export const Step11UsageData = ({
  userAnswers,
  onContinue,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);
  const [todayScreenTime, setTodayScreenTime] = useState<number>(0);
  const [topApps, setTopApps] = useState<{ name: string; time: number; icon?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        // Fetch weekly data
        const weekData = await getDailyUsageForWeekTracking(0);
        if (weekData && weekData.length > 0) {
          setWeeklyData(weekData);
        } else {
          // Fallback to estimated data
          const hours = userAnswers.realDailyHours ?? userAnswers.dailyHours;
          setWeeklyData([
            { day: 'Sun', hours: hours * 0.9 },
            { day: 'Mon', hours: hours * 1.0 },
            { day: 'Tue', hours: hours * 0.85 },
            { day: 'Wed', hours: hours * 1.1 },
            { day: 'Thu', hours: hours * 1.15 },
            { day: 'Fri', hours: hours * 1.2 },
            { day: 'Sat', hours: hours * 1.0 },
          ]);
        }

        // Fetch today's stats
        const todayStats = await getTodayUsageStats();
        if (todayStats) {
          setTodayScreenTime(todayStats.totalScreenTime);
          // Get top 3 apps
          if (todayStats.apps && todayStats.apps.length > 0) {
            // Fetch installed apps to get icons (usage stats don't include icons for performance)
            const { getInstalledApps } = await import('@/modules/usage-stats');
            const installedApps = await getInstalledApps();
            const iconMap = new Map(installedApps.map(app => [app.packageName, app.iconUrl]));

            const sortedApps = [...todayStats.apps]
              .sort((a: AppUsageData, b: AppUsageData) => b.timeInForeground - a.timeInForeground)
              .slice(0, 3)
              .map((app: AppUsageData) => ({
                name: app.appName || app.packageName.split('.').pop() || 'Unknown',
                time: app.timeInForeground,
                icon: iconMap.get(app.packageName) || '',
              }));
            setTopApps(sortedApps);
          }
        } else {
          // Fallback if no stats available
          const hours = userAnswers.realDailyHours ?? userAnswers.dailyHours;
          setTodayScreenTime(hours * 60 * 60 * 1000);
        }
      } catch (e) {
        console.log('Error fetching usage data:', e);
        const hours = userAnswers.realDailyHours ?? userAnswers.dailyHours;
        setWeeklyData([
          { day: 'Sun', hours: hours * 0.9 },
          { day: 'Mon', hours: hours * 1.0 },
          { day: 'Tue', hours: hours * 0.85 },
          { day: 'Wed', hours: hours * 1.1 },
          { day: 'Thu', hours: hours * 1.15 },
          { day: 'Fri', hours: hours * 1.2 },
          { day: 'Sat', hours: hours * 1.0 },
        ]);
        setTodayScreenTime(hours * 60 * 60 * 1000);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsageData();
  }, []);

  const totalWeeklyHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);
  const avgDailyHours = weeklyData.length > 0 ? totalWeeklyHours / weeklyData.length : userAnswers.dailyHours;
  const yearsOnTrack = Math.round((avgDailyHours * 365 * 50) / (24 * 365));
  const maxHours = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.hours)) : 1;
  const todayHours = Math.floor(todayScreenTime / 1000 / 60 / 60);
  const todayMinutes = Math.floor((todayScreenTime / 1000 / 60) % 60);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <AnimatedOrb size={100} level={3} />
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginTop: 24 }}>
          {t('sellingOnboarding.usageData.analyzing')}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>
          {t('sellingOnboarding.usageData.onlyTakeAMoment')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      {/* Header with Orb */}
      <FadeInView delay={0}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <AnimatedOrb size={80} level={1} />
        </View>
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: -0.5,
        }}>
          {t('sellingOnboarding.usageData.title')}
        </Text>
        <Text style={{
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          {t('sellingOnboarding.usageData.subtitle')}
        </Text>
      </FadeInView>

      {/* Today's Usage - Big Number */}
      <FadeInView delay={100}>
        <View style={{
          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
          borderRadius: 20,
          padding: 24,
          marginBottom: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(239, 68, 68, 0.2)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Clock size={18} color={COLORS.error} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.error }}>
              {t('sellingOnboarding.usageData.todaysScreenTime')}
            </Text>
          </View>
          <Text style={{ fontSize: 48, fontWeight: '800', color: COLORS.error }}>
            {todayHours}h {todayMinutes}m
          </Text>
        </View>
      </FadeInView>

      {/* Top Apps */}
      {topApps.length > 0 && (
        <FadeInView delay={200}>
          <Text style={{
            fontSize: 14,
            fontWeight: '700',
            color: colors.textSecondary,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {t('sellingOnboarding.usageData.topTimeWasters')}
          </Text>
          <View style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
            borderRadius: 16,
            padding: 4,
            marginBottom: 20,
            borderWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }}>
            {topApps.map((app, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderBottomWidth: index < topApps.length - 1 ? 0.5 : 0,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}>
                {app.icon ? (
                  <Image source={{ uri: app.icon }} style={{ width: 36, height: 36, borderRadius: 10, marginRight: 12 }} />
                ) : (
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Smartphone size={18} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.textPrimary }}>
                  {app.name}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.error }}>
                  {formatDuration(app.time)}
                </Text>
              </View>
            ))}
          </View>
        </FadeInView>
      )}

      {/* Weekly Chart */}
      <FadeInView delay={300}>
        <Text style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.textSecondary,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {t('sellingOnboarding.usageData.thisWeek')}
        </Text>
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          borderWidth: 0.5,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }}>
          <GradientBarChart data={weeklyData} maxValue={maxHours} />
        </View>
      </FadeInView>

      {/* Stats Cards */}
      <FadeInView delay={400}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: 'rgba(239, 68, 68, 0.2)',
          }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.error }}>
              {Math.round(totalWeeklyHours)}h
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              {t('sellingOnboarding.usageData.thisWeekCard')}
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: 'rgba(239, 68, 68, 0.2)',
          }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.error }}>
              {yearsOnTrack}y
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
              {t('sellingOnboarding.usageData.lifeOnPhone')}
            </Text>
          </View>
        </View>
      </FadeInView>

      {/* Warning Message */}
      <FadeInView delay={500}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 28,
          borderWidth: 0.5,
          borderColor: 'rgba(245, 158, 11, 0.2)',
        }}>
          <AlertTriangle size={20} color={COLORS.warning} style={{ marginRight: 10 }} />
          <Text style={{
            flex: 1,
            fontSize: 14,
            color: isDark ? 'rgba(255,255,255,0.8)' : '#78350f',
            lineHeight: 20,
          }}>
            {t('sellingOnboarding.usageData.warningMessage', { years: yearsOnTrack })}
          </Text>
        </View>
      </FadeInView>

      {/* Continue Button */}
      <FadeInView delay={600}>
        <GradientButton
          style={{ marginBottom: 8 }}
          onPress={onContinue}
          title={t('sellingOnboarding.usageData.letsFixThis')}
          colors={GRADIENT_COLORS.success}
        />
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 12: Improvement Projection - Premium Apple-like Design
// ============================================

// Diverging Curves Chart - smooth waves that cross twice
const DivergingCurvesChart = ({
  isDark,
  colors,
}: {
  isDark: boolean;
  colors: any;
}) => {
  const animProgress = React.useRef(new Animated.Value(0)).current;
  const chartWidth = Dimensions.get('window').width - 48;
  const chartHeight = 260;

  React.useEffect(() => {
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, []);

  const endX = chartWidth - 20;
  const startY = chartHeight * 0.5;
  const withLockInEndY = chartHeight * 0.12;
  const withoutEndY = chartHeight * 0.88;
  const amp = 30;
  const segments = 50;

  // White: symmetrical to red but with smaller amplitude in first half
  const withLockInPoints: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * endX;
    // Amplitude: small in first half, normal in second half
    const ampMod = t < 0.5 ? 0.3 + t * 0.4 : 0.5 + (t - 0.5) * 1;
    const wave = -Math.sin(t * Math.PI * 2.5) * amp * ampMod * (1 - t * 0.5);
    const trend = startY - (startY - withLockInEndY) * Math.pow(t, 0.9);
    withLockInPoints.push({ x, y: trend + wave });
  }

  // Red: DOWN first → up → cross → down → cross → DOWN (ends low)
  // In screen coords: DOWN = positive Y, so we need +sin to go DOWN first
  const withoutPoints: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * endX;
    const wave = Math.sin(t * Math.PI * 2.5) * amp * (1 - t * 0.6);
    const trend = startY + (withoutEndY - startY) * Math.pow(t, 0.9);
    withoutPoints.push({ x, y: trend + wave });
  }

  const animatedClipWidth = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, chartWidth],
  });

  const lastWithPoint = withLockInPoints[withLockInPoints.length - 1];
  const lastWithoutPoint = withoutPoints[withoutPoints.length - 1];

  return (
    <View style={{ height: chartHeight, width: chartWidth, alignSelf: 'center' }}>
      {/* Dashed grid lines */}
      {[0.15, 0.40, 0.65, 0.88].map((ratio, i) => (
        <View
          key={`grid-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: chartHeight * ratio,
            height: 1,
            flexDirection: 'row',
          }}
        >
          {Array.from({ length: 40 }).map((_, d) => (
            <View
              key={d}
              style={{
                width: 5,
                height: 1,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                marginRight: 5,
              }}
            />
          ))}
        </View>
      ))}

      {/* Red gradient fill UNDER the red curve */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: animatedClipWidth,
        height: chartHeight,
        overflow: 'hidden'
      }}>
        {withoutPoints.map((point, i) => {
          if (i === segments) return null;
          const next = withoutPoints[i + 1];
          const w = (next.x - point.x) + 1;
          const h = chartHeight - point.y;
          return (
            <LinearGradient
              key={`fill-${i}`}
              colors={['rgba(239, 68, 68, 0.4)', 'rgba(239, 68, 68, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                left: point.x,
                top: point.y,
                width: w,
                height: h,
              }}
            />
          );
        })}
      </Animated.View>

      {/* Curves */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: animatedClipWidth,
        height: chartHeight,
        overflow: 'hidden'
      }}>
        {/* White line */}
        {withLockInPoints.map((point, i) => {
          if (i === segments) return null;
          const next = withLockInPoints[i + 1];
          const dx = next.x - point.x;
          const dy = next.y - point.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ang = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`w-${i}`}
              style={{
                position: 'absolute',
                left: point.x,
                top: point.y - 1.5,
                width: len + 1,
                height: 3,
                backgroundColor: isDark ? '#FFFFFF' : colors.textPrimary,
                transform: [{ rotate: `${ang}deg` }],
                transformOrigin: 'left center',
              }}
            />
          );
        })}

        {/* Red line */}
        {withoutPoints.map((point, i) => {
          if (i === segments) return null;
          const next = withoutPoints[i + 1];
          const dx = next.x - point.x;
          const dy = next.y - point.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ang = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`wo-${i}`}
              style={{
                position: 'absolute',
                left: point.x,
                top: point.y - 1.5,
                width: len + 1,
                height: 3,
                backgroundColor: COLORS.error,
                transform: [{ rotate: `${ang}deg` }],
                transformOrigin: 'left center',
              }}
            />
          );
        })}

        {/* End dots */}
        <View style={{
          position: 'absolute',
          left: lastWithPoint.x - 6,
          top: lastWithPoint.y - 6,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: isDark ? '#FFFFFF' : colors.textPrimary,
        }} />
        <View style={{
          position: 'absolute',
          left: lastWithoutPoint.x - 6,
          top: lastWithoutPoint.y - 6,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: COLORS.error,
        }} />
      </Animated.View>

      {/* Labels */}
      <Text style={{
        position: 'absolute',
        left: lastWithPoint.x - 40,
        top: lastWithPoint.y - 26,
        fontSize: 11,
        fontWeight: '600',
        color: isDark ? '#FFFFFF' : colors.textPrimary,
      }}>
        With LockIn
      </Text>
      <Text style={{
        position: 'absolute',
        left: lastWithoutPoint.x - 50,
        top: lastWithoutPoint.y + 14,
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.error,
      }}>
        Without LockIn
      </Text>

      {/* Day labels */}
      <Text style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        fontSize: 13,
        fontWeight: '500',
        color: colors.textTertiary,
      }}>
        Day 1
      </Text>
      <Text style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        fontSize: 13,
        fontWeight: '500',
        color: colors.textTertiary,
      }}>
        Day 14
      </Text>
    </View>
  );
};

export const Step12Projection = ({
  userAnswers,
  onContinue,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();

  const hours = userAnswers.realDailyHours ?? userAnswers.dailyHours;
  const savedHoursWeekly = Math.round(hours * 0.5 * 7);

  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      {/* Header */}
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 32,
          fontWeight: '800',
          color: colors.textPrimary,
          marginBottom: 12,
          marginTop: 20,
          lineHeight: 40,
        }}>
          {t('sellingOnboarding.projection.title')}
        </Text>
        <Text style={{
          fontSize: 17,
          color: colors.textSecondary,
          marginBottom: 40,
        }}>
          {t('sellingOnboarding.projection.subtitle', { hours: savedHoursWeekly })}
        </Text>
      </FadeInView>

      {/* Chart */}
      <FadeInView delay={200}>
        <DivergingCurvesChart isDark={isDark} colors={colors} />
      </FadeInView>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Continue Button */}
      <FadeInView delay={400}>
        <WhiteGlassButton onPress={onContinue} title={t('sellingOnboarding.projection.continue')} shadowDelay={1000} style={{ marginBottom: 100 }} />
      </FadeInView>
    </View>
  );
};

// ============================================
// SCREEN 13: Features & Paywall
// ============================================

export const Step13Comparison = ({
  userAnswers,
  onContinue,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();
  const [showPaywall, setShowPaywall] = useState(false);
  const hours = userAnswers.realDailyHours ?? userAnswers.dailyHours;
  const savedHoursWeekly = Math.round(hours * 0.5 * 7);

  const reviews = [
    { name: t('sellingOnboarding.comparison.reviews.review1Name'), text: t('sellingOnboarding.comparison.reviews.review1Text') },
    { name: t('sellingOnboarding.comparison.reviews.review2Name'), text: t('sellingOnboarding.comparison.reviews.review2Text') },
    { name: t('sellingOnboarding.comparison.reviews.review3Name'), text: t('sellingOnboarding.comparison.reviews.review3Text') },
    { name: t('sellingOnboarding.comparison.reviews.review4Name'), text: t('sellingOnboarding.comparison.reviews.review4Text') },
  ];

  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setShowPaywall(false);
    console.log('Subscribe to:', plan);
  };

  const handleRestore = async () => {
    try {
      await Purchases.restorePurchases();
    } catch (e) {
      console.log('Restore error:', e);
    }
  };

  const features = [
    {
      icon: <Bot size={22} color={COLORS.gradientPurple} />,
      title: t('sellingOnboarding.comparison.features.smartCoach'),
      description: t('sellingOnboarding.comparison.features.smartCoachDesc'),
    },
    {
      icon: <CheckCircle2 size={22} color={COLORS.success} />,
      title: t('sellingOnboarding.comparison.features.taskVerification'),
      description: t('sellingOnboarding.comparison.features.taskVerificationDesc'),
    },
    {
      icon: <Target size={22} color={COLORS.gradientCyan} />,
      title: t('sellingOnboarding.comparison.features.focusSessions'),
      description: t('sellingOnboarding.comparison.features.focusSessionsDesc'),
    },
    {
      icon: <Sparkles size={22} color={COLORS.warning} />,
      title: t('sellingOnboarding.comparison.features.dailyGoals'),
      description: t('sellingOnboarding.comparison.features.dailyGoalsDesc'),
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
        onRestore={handleRestore}
        savedHours={savedHoursWeekly}
      />

      {/* Header */}
      <FadeInView delay={0}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <AnimatedOrb size={70} level={3} />
        </View>
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: -0.5,
        }}>
          {t('sellingOnboarding.comparison.title')}
        </Text>
        <Text style={{
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          {t('sellingOnboarding.comparison.getHoursBack', { hours: savedHoursWeekly })}
        </Text>
      </FadeInView>

      {/* Features Grid */}
      <FadeInView delay={100}>
        <View style={{ marginBottom: 24 }}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                borderWidth: 0.5,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
                {feature.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 }}>
                  {feature.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </FadeInView>

      {/* Social Proof Section */}
      <FadeInView delay={200}>
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          borderWidth: 0.5,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }}>
          {/* Stats Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.success }}>92%</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{t('sellingOnboarding.comparison.stats.completeTasks')}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary }}>4.8</Text>
                <Star size={16} color="#FBBF24" fill="#FBBF24" style={{ marginLeft: 4 }} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{t('sellingOnboarding.comparison.stats.appRating')}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary }}>3x</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{t('sellingOnboarding.comparison.stats.moreProductive')}</Text>
            </View>
          </View>

          {/* Review */}
          <View>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {[1,2,3,4,5].map((star) => (
                <Star key={star} size={16} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 2 }} />
              ))}
            </View>
            <Text style={{
              fontSize: 15,
              color: colors.textPrimary,
              marginBottom: 12,
              lineHeight: 22,
              fontStyle: 'italic',
            }}>
              "{reviews[currentReview].text}"
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
                {reviews[currentReview].name}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {reviews.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: index === currentReview ? colors.textPrimary : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                      marginHorizontal: 3,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </FadeInView>

      {/* CTA Button */}
      <FadeInView delay={300}>
        <GradientButton
          onPress={() => setShowPaywall(true)}
          title={t('sellingOnboarding.comparison.startFreeTrial')}
          subtitle={t('sellingOnboarding.comparison.threeDaysFree')}
          style={{ marginBottom: 12 }}
        />
      </FadeInView>

      <FadeInView delay={400}>
        <TouchableOpacity onPress={onContinue} style={{ padding: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.textTertiary }}>{t('sellingOnboarding.comparison.maybeLater')}</Text>
        </TouchableOpacity>
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 14: Notifications Permission
// ============================================

export const Step14Notifications = ({
  onContinue,
}: {
  onContinue: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleGrantPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      setHasPermission(true);
      setTimeout(onContinue, 500);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        {/* Notification Preview */}
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
          borderRadius: 20,
          padding: 16,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                marginRight: 14,
              }}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                  LockIn
                </Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                  {t('sellingOnboarding.notifications.now')}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                {t('sellingOnboarding.notifications.previewMessage')}
              </Text>
            </View>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 12,
          letterSpacing: -0.5,
        }}>
          {t('sellingOnboarding.notifications.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 40,
          lineHeight: 24,
        }}>
          {t('sellingOnboarding.notifications.subtitle')}
        </Text>
      </FadeInView>

      {hasPermission ? (
        <FadeInView delay={300}>
          <GlassCard style={{ alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={36} color={COLORS.success} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.success }}>
              {t('sellingOnboarding.notifications.enabled')}
            </Text>
          </GlassCard>
          <GradientButton onPress={onContinue} title={t('sellingOnboarding.notifications.continue')} />
        </FadeInView>
      ) : (
        <>
          <FadeInView delay={300}>
            <GradientButton
              onPress={handleGrantPermission}
              title={t('sellingOnboarding.notifications.continue')}
              style={{ marginBottom: 12 }}
            />
          </FadeInView>

          <FadeInView delay={400}>
            <TouchableOpacity onPress={onContinue} style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.textTertiary }}>{t('sellingOnboarding.notifications.maybeLater')}</Text>
            </TouchableOpacity>
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
};

// ============================================
// SCREEN 15: Daily Goal Selection
// ============================================

export const Step15DailyGoal = ({
  onSelect,
}: {
  onSelect: (minutes: number) => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();
  const [goalMinutes, setGoalMinutes] = useState(30); // Default 30 minutes

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${t('sellingOnboarding.dailyGoal.min')}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const getGoalDescription = (minutes: number) => {
    if (minutes <= 15) return t('sellingOnboarding.dailyGoal.minimalUsage');
    if (minutes <= 30) return t('sellingOnboarding.dailyGoal.lightUsage');
    if (minutes <= 60) return t('sellingOnboarding.dailyGoal.moderateUsage');
    if (minutes <= 120) return t('sellingOnboarding.dailyGoal.balancedApproach');
    return t('sellingOnboarding.dailyGoal.flexibleUsage');
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Target size={56} color={COLORS.success} />
        </View>
        <Text style={{
          fontSize: 32,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 12,
          letterSpacing: -0.5,
        }}>
          {t('sellingOnboarding.dailyGoal.title')}
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 40,
          lineHeight: 24,
        }}>
          {t('sellingOnboarding.dailyGoal.subtitle')}
        </Text>
      </FadeInView>

      {/* Big Time Display */}
      <FadeInView delay={200}>
        <View style={{
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(16, 185, 129, 0.2)',
        }}>
          <Text style={{
            fontSize: 64,
            fontWeight: '800',
            color: COLORS.success,
            letterSpacing: -2,
          }}>
            {formatTime(goalMinutes)}
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 8,
          }}>
            {getGoalDescription(goalMinutes)}
          </Text>
        </View>
      </FadeInView>

      {/* Custom Slider */}
      <FadeInView delay={300}>
        <View style={{ marginBottom: 16, paddingHorizontal: 8 }}>
          <View style={{
            height: 8,
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={GRADIENT_COLORS.success}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${((goalMinutes - 5) / (180 - 5)) * 100}%`,
                borderRadius: 4,
              }}
            />
          </View>

          {/* Touch area for slider */}
          <View
            style={{
              position: 'absolute',
              top: -20,
              left: 0,
              right: 0,
              height: 48,
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              const { locationX } = e.nativeEvent;
              const containerWidth = width - 64; // 24*2 padding + 8*2 extra
              const percentage = Math.max(0, Math.min(1, locationX / containerWidth));
              const newValue = Math.round(5 + percentage * (180 - 5));
              setGoalMinutes(newValue);
            }}
            onResponderMove={(e) => {
              const { locationX } = e.nativeEvent;
              const containerWidth = width - 64;
              const percentage = Math.max(0, Math.min(1, locationX / containerWidth));
              const newValue = Math.round(5 + percentage * (180 - 5));
              setGoalMinutes(newValue);
            }}
          />
        </View>

        {/* Labels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 40 }}>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>{t('sellingOnboarding.dailyGoal.fiveMin')}</Text>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>{t('sellingOnboarding.dailyGoal.threeHours')}</Text>
        </View>
      </FadeInView>

      <FadeInView delay={400}>
        <GradientButton
          onPress={() => onSelect(goalMinutes)}
          title={t('sellingOnboarding.dailyGoal.continue')}
          colors={GRADIENT_COLORS.success}
        />
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 16: Apps & Websites Selection
// ============================================

export const Step16AppSelection = ({
  preloadedApps = [],
  appsLoading = false,
  onConfirm,
}: {
  preloadedApps?: InstalledApp[];
  appsLoading?: boolean;
  onConfirm: (apps: string[], websites: string[]) => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'apps' | 'websites'>('apps');
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>(DEFAULT_BLOCKED_SITES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use pre-loaded apps if available
    if (preloadedApps.length > 0) {
      const filtered = preloadedApps.filter(app => app.packageName !== CURRENT_APP_PACKAGE);
      const socialApps = filtered
        .filter(app => SOCIAL_PACKAGE_NAMES.includes(app.packageName))
        .map(app => app.packageName);

      // Sort once: selected first, then alphabetically
      const sorted = [...filtered].sort((a, b) => {
        const aSelected = socialApps.includes(a.packageName);
        const bSelected = socialApps.includes(b.packageName);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.appName.localeCompare(b.appName);
      });

      setInstalledApps(sorted);
      setSelectedApps(socialApps);
      setIsLoading(false);
    } else if (!appsLoading) {
      // Fallback: fetch apps if not pre-loaded
      const fetchApps = async () => {
        try {
          const apps = await getInstalledApps();
          const filtered = apps.filter(app => app.packageName !== CURRENT_APP_PACKAGE);
          const socialApps = filtered
            .filter(app => SOCIAL_PACKAGE_NAMES.includes(app.packageName))
            .map(app => app.packageName);

          // Sort once: selected first, then alphabetically
          const sorted = [...filtered].sort((a, b) => {
            const aSelected = socialApps.includes(a.packageName);
            const bSelected = socialApps.includes(b.packageName);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return a.appName.localeCompare(b.appName);
          });

          setInstalledApps(sorted);
          setSelectedApps(socialApps);
        } catch (error) {
          console.error('Error fetching installed apps:', error);
          setSelectedApps(DEFAULT_BLOCKED_APPS);
        } finally {
          setIsLoading(false);
        }
      };
      fetchApps();
    }
  }, [preloadedApps, appsLoading]);

  const toggleApp = (id: string) => {
    if (selectedApps.includes(id)) {
      setSelectedApps(selectedApps.filter(a => a !== id));
    } else {
      setSelectedApps([...selectedApps, id]);
    }
  };

  const toggleWebsite = (id: string) => {
    if (selectedWebsites.includes(id)) {
      setSelectedWebsites(selectedWebsites.filter(w => w !== id));
    } else {
      setSelectedWebsites([...selectedWebsites, id]);
    }
  };

  const filteredApps = installedApps
    .filter(app => app.appName.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredWebsites = POPULAR_WEBSITES.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.id.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <FadeInView delay={0}>
          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: -0.5,
          }}>
            {t('sellingOnboarding.appSelection.title')}
          </Text>
          <Text style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
          }}>
            {t('sellingOnboarding.appSelection.subtitle')}
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <GlassCard noPadding style={{ flexDirection: 'row', gap: 8, padding: 6, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setActiveTab('apps')}
              style={{
                flex: 1,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {activeTab === 'apps' ? (
                <>
                  <LinearGradient
                    colors={[COLORS.gradientPurple, COLORS.gradientBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.25)', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.6 }}
                    style={[StyleSheet.absoluteFill, { height: '60%' }]}
                  />
                </>
              ) : null}
              <View style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={18} color={activeTab === 'apps' ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: activeTab === 'apps' ? '#FFFFFF' : colors.textSecondary,
                }}>
                  {t('sellingOnboarding.appSelection.appsTab')}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('websites')}
              style={{
                flex: 1,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {activeTab === 'websites' ? (
                <>
                  <LinearGradient
                    colors={[COLORS.gradientPurple, COLORS.gradientBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.25)', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.6 }}
                    style={[StyleSheet.absoluteFill, { height: '60%' }]}
                  />
                </>
              ) : null}
              <View style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={18} color={activeTab === 'websites' ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: activeTab === 'websites' ? '#FFFFFF' : colors.textSecondary,
                }}>
                  {t('sellingOnboarding.appSelection.websitesTab')}
                </Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        </FadeInView>

        <FadeInView delay={200}>
          <GlassCard noPadding style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 12,
                fontSize: 16,
                color: colors.textPrimary,
              }}
              placeholder={activeTab === 'apps' ? t('sellingOnboarding.appSelection.searchApps') : t('sellingOnboarding.appSelection.searchWebsites')}
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </GlassCard>
        </FadeInView>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
        <FadeInView delay={300}>
          {activeTab === 'apps' ? (
            (isLoading || appsLoading) ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <AnimatedOrb size={60} level={3} />
                <Text style={{ color: colors.textSecondary, marginTop: 16 }}>{t('sellingOnboarding.appSelection.loadingApps')}</Text>
              </View>
            ) : filteredApps.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: colors.textSecondary }}>{t('sellingOnboarding.appSelection.noAppsFound')}</Text>
              </View>
            ) : (
              filteredApps.map((app, index) => {
                const isSelected = selectedApps.includes(app.packageName);
                return (
                  <TouchableOpacity
                    key={app.packageName}
                    onPress={() => toggleApp(app.packageName)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 14,
                      overflow: 'hidden',
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    {isSelected && (
                      <>
                        <LinearGradient
                          colors={isDark
                            ? ['rgba(16, 185, 129, 0.15)', 'rgba(6, 182, 212, 0.08)']
                            : ['rgba(16, 185, 129, 0.12)', 'rgba(6, 182, 212, 0.06)']
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.1)', 'transparent']}
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 0.6 }}
                          style={[StyleSheet.absoluteFill, { height: '60%' }]}
                        />
                      </>
                    )}
                    {app.iconUrl ? (
                      <Image source={{ uri: app.iconUrl }} style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }} />
                    ) : (
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: colors.glassLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Smartphone size={20} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' }}>
                      {app.appName}
                    </Text>
                    {isSelected && (
                      <Check size={20} color={COLORS.success} strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                );
              })
            )
          ) : (
            filteredWebsites.map((site, index) => {
              const isSelected = selectedWebsites.includes(site.id);
              return (
                <TouchableOpacity
                  key={site.id}
                  onPress={() => toggleWebsite(site.id)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: isSelected ? 1 : 0,
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                  }}
                >
                  {isSelected && (
                    <>
                      <LinearGradient
                        colors={isDark
                          ? ['rgba(16, 185, 129, 0.15)', 'rgba(6, 182, 212, 0.08)']
                          : ['rgba(16, 185, 129, 0.12)', 'rgba(6, 182, 212, 0.06)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.1)', 'transparent']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.6 }}
                        style={[StyleSheet.absoluteFill, { height: '60%' }]}
                      />
                    </>
                  )}
                  {site.icon ? (
                    <Image source={site.icon} style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }} />
                  ) : (
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.glassLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Globe size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: '500' }}>
                      {site.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                      {site.id}
                    </Text>
                  </View>
                  {isSelected && (
                    <Check size={20} color={COLORS.success} strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </FadeInView>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 8, paddingTop: 8 }}>
        <GradientButton
          onPress={() => onConfirm(selectedApps, selectedWebsites)}
          title={t('sellingOnboarding.appSelection.startBlocking')}
          subtitle={t('sellingOnboarding.appSelection.selectedCount', { apps: selectedApps.length, websites: selectedWebsites.length })}
        />
      </View>
    </View>
  );
};
