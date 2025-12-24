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
} from 'react-native';
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
import { GlassCard, GradientButton, GradientBarChart } from './UIComponents';
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
  const [isChecking, setIsChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

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
        const granted = await hasOverlayPermission();
        setHasPermission(granted);
        setIsChecking(false);
      }
    });
    return () => subscription.remove();
  }, [isChecking]);

  const learnMoreFeatures = [
    { icon: '🛡️', title: 'Block Distracting Apps', description: 'Show a blocking screen when you try to open blocked apps' },
    { icon: '⏰', title: 'Break Reminders', description: 'Remind you to take breaks during long sessions' },
    { icon: '🎯', title: 'Focus Sessions', description: 'Keep you on track during focus mode' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      <LearnMoreModal
        visible={showLearnMore}
        onClose={() => setShowLearnMore(false)}
        title="Why We Need This"
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
          Enable App Blocking
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <GlassCard variant="light" style={{ marginBottom: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Shield size={20} color={COLORS.success} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: COLORS.success, flex: 1, fontWeight: '500' }}>
              This allows us to show the block screen
            </Text>
          </View>
        </GlassCard>
      </FadeInView>

      {/* Video commented out
      <FadeInView delay={200}>
        <VideoPlaceholder />
      </FadeInView>
      */}

      {hasPermission ? (
        <FadeInView delay={300}>
          <GlassCard style={{ alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={36} color={COLORS.success} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.success }}>
              Permission granted!
            </Text>
          </GlassCard>
          <GradientButton onPress={onContinue} title="Continue" colors={GRADIENT_COLORS.success} />
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
                How to enable:
              </Text>
              {['Find "LockIn" in the list', 'Toggle "Allow display over other apps"'].map((step, i) => (
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
              title={isChecking ? 'Checking...' : 'Continue'}
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
                Learn more
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
  const [isChecking, setIsChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showReassurance, setShowReassurance] = useState(false);
  const [showDeclineWarning, setShowDeclineWarning] = useState(false);

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
        const granted = await isAccessibilityServiceEnabled();
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
    { icon: '🔍', title: 'Detect App Opens', description: 'Know when you try to open a blocked app' },
    { icon: '🛡️', title: 'Instant Blocking', description: 'Block apps before they fully open' },
    { icon: '🔒', title: 'Privacy First', description: 'We only detect app names, nothing else' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      <LearnMoreModal
        visible={showLearnMore}
        onClose={() => setShowLearnMore(false)}
        title="Why We Need This"
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
          Enable Accessibility
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
            Your phone may show a warning - this is normal! We only use this to detect when you open blocked apps.
          </Text>
        </GlassCard>
      </FadeInView>

      {/* Video commented out
      <FadeInView delay={200}>
        <VideoPlaceholder />
      </FadeInView>
      */}

      {hasPermission ? (
        <FadeInView delay={300}>
          <GlassCard style={{ alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={36} color={COLORS.success} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.success }}>
              Permission granted!
            </Text>
          </GlassCard>
          <GradientButton onPress={onContinue} title="Continue" colors={GRADIENT_COLORS.success} />
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
                How to enable:
              </Text>
              {['Find "LockIn" in Installed apps', 'Toggle it ON', 'Confirm when prompted'].map((step, i) => (
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
              title={isChecking ? 'Checking...' : 'Continue'}
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
                Learn more
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
            const sortedApps = [...todayStats.apps]
              .sort((a: AppUsageData, b: AppUsageData) => b.timeInForeground - a.timeInForeground)
              .slice(0, 3)
              .map((app: AppUsageData) => ({
                name: app.appName || app.packageName.split('.').pop() || 'Unknown',
                time: app.timeInForeground,
                icon: app.iconUrl,
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
          Analyzing your usage...
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>
          This will only take a moment
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
          Here's Your Reality
        </Text>
        <Text style={{
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          Based on your actual phone usage
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
              TODAY'S SCREEN TIME
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
            Top Time Wasters Today
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
          This Week
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
              This week
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
              Life on phone
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
            At this rate, you'll spend <Text style={{ fontWeight: '700' }}>{yearsOnTrack} years</Text> of your life staring at your phone.
          </Text>
        </View>
      </FadeInView>

      {/* Continue Button */}
      <FadeInView delay={600}>
        <GradientButton
          style={{ marginBottom: 8 }}
          onPress={onContinue}
          title="Let's Fix This"
          colors={GRADIENT_COLORS.success}
        />
      </FadeInView>
    </ScrollView>
  );
};

// ============================================
// SCREEN 12: Improvement Projection
// ============================================

export const Step12Projection = ({
  userAnswers,
  onContinue,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const [weeklyData, setWeeklyData] = useState<{ day: string; current: number; projected: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hours = userAnswers.realDailyHours ?? userAnswers.dailyHours;
  const reductionPercent = hours < 3.5 ? 30 : 50;
  const savedHoursDaily = (hours * reductionPercent) / 100;
  const savedHoursWeekly = Math.round(savedHoursDaily * 7);
  const savedYears = Math.round((savedHoursDaily * 365 * 50) / (24 * 365));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const realData = await getDailyUsageForWeekTracking(0);
        if (realData && realData.length > 0) {
          // Use real data and calculate projected reduction
          setWeeklyData(realData.map(d => ({
            day: d.day,
            current: d.hours,
            projected: d.hours * (1 - reductionPercent / 100),
          })));
        } else {
          // Fallback to estimated data
          const newHours = hours - savedHoursDaily;
          setWeeklyData([
            { day: 'Sun', current: hours * 0.9, projected: newHours * 0.9 },
            { day: 'Mon', current: hours * 1.0, projected: newHours * 1.0 },
            { day: 'Tue', current: hours * 0.85, projected: newHours * 0.85 },
            { day: 'Wed', current: hours * 1.1, projected: newHours * 1.1 },
            { day: 'Thu', current: hours * 1.15, projected: newHours * 1.15 },
            { day: 'Fri', current: hours * 1.2, projected: newHours * 1.2 },
            { day: 'Sat', current: hours * 1.0, projected: newHours * 1.0 },
          ]);
        }
      } catch (e) {
        const newHours = hours - savedHoursDaily;
        setWeeklyData([
          { day: 'Sun', current: hours * 0.9, projected: newHours * 0.9 },
          { day: 'Mon', current: hours * 1.0, projected: newHours * 1.0 },
          { day: 'Tue', current: hours * 0.85, projected: newHours * 0.85 },
          { day: 'Wed', current: hours * 1.1, projected: newHours * 1.1 },
          { day: 'Thu', current: hours * 1.15, projected: newHours * 1.15 },
          { day: 'Fri', current: hours * 1.2, projected: newHours * 1.2 },
          { day: 'Sat', current: hours * 1.0, projected: newHours * 1.0 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const maxHours = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.current)) : 1;
  const totalCurrentHours = weeklyData.reduce((sum, d) => sum + d.current, 0);
  const totalProjectedHours = weeklyData.reduce((sum, d) => sum + d.projected, 0);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <AnimatedOrb size={100} level={4} />
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginTop: 24 }}>
          Calculating your potential...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      {/* Header with Green Orb */}
      <FadeInView delay={0}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <AnimatedOrb size={80} level={4} />
        </View>
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: -0.5,
        }}>
          Your Potential
        </Text>
        <Text style={{
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          See how much time you could save
        </Text>
      </FadeInView>

      {/* Reduction Badge */}
      <FadeInView delay={100}>
        <View style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(16, 185, 129, 0.2)',
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.success,
            textAlign: 'center',
          }}>
            Reduce screen time by {reductionPercent}%
          </Text>
        </View>
      </FadeInView>

      {/* Comparison Chart */}
      <FadeInView delay={200}>
        <Text style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.textSecondary,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Weekly Projection
        </Text>
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          borderWidth: 0.5,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 }}>
            {weeklyData.map((day, index) => {
              const currentHeight = Math.max((day.current / maxHours) * 100, 4);
              const projectedHeight = Math.max((day.projected / maxHours) * 100, 4);
              return (
                <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 2 }}>
                    <View style={{
                      width: 12,
                      height: currentHeight,
                      backgroundColor: COLORS.error,
                      borderRadius: 6,
                      opacity: 0.5,
                    }} />
                    <LinearGradient
                      colors={GRADIENT_COLORS.success}
                      style={{
                        width: 12,
                        height: projectedHeight,
                        borderRadius: 6,
                      }}
                    />
                  </View>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '500',
                    color: colors.textTertiary,
                    marginTop: 10,
                  }}>
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 20, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.error, opacity: 0.5, marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Current ({Math.round(totalCurrentHours)}h)</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LinearGradient colors={GRADIENT_COLORS.success} style={{ width: 10, height: 10, borderRadius: 5, marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>With LockIn ({Math.round(totalProjectedHours)}h)</Text>
            </View>
          </View>
        </View>
      </FadeInView>

      {/* Stats Cards */}
      <FadeInView delay={300}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.success }}>
              +{savedHoursWeekly}h
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
              Free time/week
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.success }}>
              +{savedYears}y
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
              Life reclaimed
            </Text>
          </View>
        </View>
      </FadeInView>

      {/* Motivational Text */}
      <FadeInView delay={400}>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 28,
          lineHeight: 24,
        }}>
          Accomplish your goals faster, be more productive and fulfilled
        </Text>
      </FadeInView>

      {/* Continue Button */}
      <FadeInView delay={500}>
        <GradientButton
          onPress={onContinue}
          title="Continue"
          colors={GRADIENT_COLORS.success}
          style={{ marginBottom: 8 }}
        />
      </FadeInView>
    </ScrollView>
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
  const [showPaywall, setShowPaywall] = useState(false);
  const hours = userAnswers.realDailyHours ?? userAnswers.dailyHours;
  const savedHoursWeekly = Math.round(hours * 0.5 * 7);

  const reviews = [
    { name: 'Sarah M.', text: 'I was losing 5 hours daily to Instagram. Now I read books again and sleep better.' },
    { name: 'Mike R.', text: 'My productivity doubled in the first week. I finally complete my daily tasks.' },
    { name: 'Emma L.', text: 'Finally have time for my hobbies. LockIn helped me reclaim my evenings.' },
    { name: 'James K.', text: 'The task verification changed everything. I actually finish what I start now.' },
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
      title: 'Smart Coach',
      description: 'Verifies task completion through chat',
    },
    {
      icon: <CheckCircle2 size={22} color={COLORS.success} />,
      title: 'Task Verification',
      description: 'Prove you completed your goals',
    },
    {
      icon: <Target size={22} color={COLORS.gradientCyan} />,
      title: 'Focus Sessions',
      description: 'Block distractions while you work',
    },
    {
      icon: <Sparkles size={22} color={COLORS.warning} />,
      title: 'Daily Goals',
      description: 'Build better habits consistently',
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
          Unlock Your Potential
        </Text>
        <Text style={{
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          Get <Text style={{ color: COLORS.success, fontWeight: '700' }}>{savedHoursWeekly}+ hours</Text> back every week
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
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Complete Tasks</Text>
            </View>
            <View style={{ width: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary }}>4.8</Text>
                <Star size={16} color="#FBBF24" fill="#FBBF24" style={{ marginLeft: 4 }} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>App Rating</Text>
            </View>
            <View style={{ width: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary }}>3x</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>More Productive</Text>
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
          title="Start Free Trial"
          subtitle="3 days free"
          style={{ marginBottom: 12 }}
        />
      </FadeInView>

      <FadeInView delay={400}>
        <TouchableOpacity onPress={onContinue} style={{ padding: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.textTertiary }}>Maybe later</Text>
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
                  now
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                You've been scrolling for 30 min. Time for a break?
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
          Allow Notifications
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
          So we can remind you about over-scrolling and help you stay on track with your goals
        </Text>
      </FadeInView>

      {hasPermission ? (
        <FadeInView delay={300}>
          <GlassCard style={{ alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={36} color={COLORS.success} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.success }}>
              Notifications enabled!
            </Text>
          </GlassCard>
          <GradientButton onPress={onContinue} title="Continue" />
        </FadeInView>
      ) : (
        <>
          <FadeInView delay={300}>
            <GradientButton
              onPress={handleGrantPermission}
              title="Continue"
              style={{ marginBottom: 12 }}
            />
          </FadeInView>

          <FadeInView delay={400}>
            <TouchableOpacity onPress={onContinue} style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.textTertiary }}>Maybe later</Text>
            </TouchableOpacity>
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
};

// ============================================
// SCREEN 15: Apps & Websites Selection
// ============================================

export const Step15AppSelection = ({
  preloadedApps = [],
  appsLoading = false,
  onConfirm,
}: {
  preloadedApps?: InstalledApp[];
  appsLoading?: boolean;
  onConfirm: (apps: string[], websites: string[]) => void;
}) => {
  const { colors, isDark } = useOnboardingTheme();
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
      const filteredApps = preloadedApps.filter(app => app.packageName !== CURRENT_APP_PACKAGE);
      setInstalledApps(filteredApps);

      const socialApps = filteredApps
        .filter(app => SOCIAL_PACKAGE_NAMES.includes(app.packageName))
        .map(app => app.packageName);
      setSelectedApps(socialApps);
      setIsLoading(false);
    } else if (!appsLoading) {
      // Fallback: fetch apps if not pre-loaded
      const fetchApps = async () => {
        try {
          const apps = await getInstalledApps();
          const filteredApps = apps.filter(app => app.packageName !== CURRENT_APP_PACKAGE);
          setInstalledApps(filteredApps);

          const socialApps = filteredApps
            .filter(app => SOCIAL_PACKAGE_NAMES.includes(app.packageName))
            .map(app => app.packageName);
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
    .filter(app => app.appName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aSelected = selectedApps.includes(a.packageName);
      const bSelected = selectedApps.includes(b.packageName);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.appName.localeCompare(b.appName);
    });

  const filteredWebsites = POPULAR_WEBSITES.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ToggleButtonLocal = ({
    isSelected,
    onPress,
  }: {
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: isSelected ? COLORS.success : colors.glassBorder,
        backgroundColor: isSelected ? COLORS.success : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
    </TouchableOpacity>
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
            What to block?
          </Text>
          <Text style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
          }}>
            Don't worry, you can change this later
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <GlassCard noPadding style={{ flexDirection: 'row', padding: 4, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setActiveTab('apps')}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              {activeTab === 'apps' ? (
                <LinearGradient
                  colors={GRADIENT_COLORS.primary}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 14,
                  }}
                />
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Smartphone size={18} color={activeTab === 'apps' ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: activeTab === 'apps' ? '#FFFFFF' : colors.textSecondary,
                }}>
                  Apps
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('websites')}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              {activeTab === 'websites' ? (
                <LinearGradient
                  colors={GRADIENT_COLORS.primary}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 14,
                  }}
                />
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Globe size={18} color={activeTab === 'websites' ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: activeTab === 'websites' ? '#FFFFFF' : colors.textSecondary,
                }}>
                  Websites
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
              placeholder={`Search ${activeTab}...`}
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
                <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading your apps...</Text>
              </View>
            ) : filteredApps.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: colors.textSecondary }}>No apps found</Text>
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
                      paddingVertical: 14,
                      borderBottomWidth: index < filteredApps.length - 1 ? 1 : 0,
                      borderBottomColor: colors.glassBorder,
                    }}
                  >
                    {app.iconUrl ? (
                      <Image source={{ uri: app.iconUrl }} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 14 }} />
                    ) : (
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: colors.glassLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}>
                        <Smartphone size={22} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={{ flex: 1, fontSize: 16, color: colors.textPrimary, fontWeight: '500' }}>
                      {app.appName}
                    </Text>
                    <ToggleButtonLocal isSelected={isSelected} onPress={() => toggleApp(app.packageName)} />
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
                    paddingVertical: 14,
                    borderBottomWidth: index < filteredWebsites.length - 1 ? 1 : 0,
                    borderBottomColor: colors.glassBorder,
                  }}
                >
                  {site.icon ? (
                    <Image source={site.icon} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 14 }} />
                  ) : (
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: colors.glassLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}>
                      <Globe size={22} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '500' }}>
                      {site.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                      {site.id}
                    </Text>
                  </View>
                  <ToggleButtonLocal isSelected={isSelected} onPress={() => toggleWebsite(site.id)} />
                </TouchableOpacity>
              );
            })
          )}
        </FadeInView>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 8, paddingTop: 8 }}>
        <GradientButton
          onPress={() => onConfirm(selectedApps, selectedWebsites)}
          title="Start Blocking"
          subtitle={`${selectedApps.length} apps · ${selectedWebsites.length} websites`}
        />
      </View>
    </View>
  );
};
