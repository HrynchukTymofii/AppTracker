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
  const { colors } = useOnboardingTheme();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{ alignSelf: 'center', marginBottom: 40 }}>
          <AnimatedOrb size={160} level={5} />
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 40,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 16,
          letterSpacing: -1,
        }}>
          Hello!
        </Text>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 22,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 12,
          lineHeight: 30,
          fontWeight: '500',
        }}>
          Welcome to LockIn
        </Text>
      </FadeInView>

      <FadeInView delay={300}>
        <Text style={{
          fontSize: 17,
          color: colors.textTertiary,
          textAlign: 'center',
          marginBottom: 56,
          lineHeight: 26,
        }}>
          We're ready to help you with{'\n'}
          <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
            taking control of your time
          </Text>
        </Text>
      </FadeInView>

      <FadeInView delay={400}>
        <GradientButton onPress={onContinue} title="Let's Start" />
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
  const ageRanges = [
    { age: 16, label: 'Under 18' },
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
          How old are you?
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 36,
        }}>
          This helps us personalize your experience
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
  const options = [
    { hours: 1.5, label: '1-2 hours' },
    { hours: 3, label: '2-4 hours' },
    { hours: 5, label: '4-6 hours' },
    { hours: 7, label: '6-8 hours' },
    { hours: 9, label: '8+ hours' },
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
          Daily screen time?
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 36,
        }}>
          Be honest — we won't judge
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
          We have bad news{'\n'}and good ones
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
          Let us show you something important about your screen time...
        </Text>
      </FadeInView>

      <FadeInView delay={600}>
        <GradientButton onPress={onContinue} title="Show Me" />
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
  const hours = userAnswers.dailyHours;
  const daysPerYear = Math.round((hours * 365) / 24);
  const yearsPerLife = Math.round((hours * 365 * 50) / (24 * 365));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <GlassCard style={{ marginBottom: 24, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
          <LinearGradient
            colors={GRADIENT_COLORS.danger}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 20,
              alignSelf: 'center',
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 1,
            }}>
              THE BAD NEWS
            </Text>
          </LinearGradient>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 17,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 0,
          lineHeight: 26,
        }}>
          At {hours} hours per day, you will spend
        </Text>
      </FadeInView>

      <FadeInView delay={400}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <AnimatedCounter
            value={daysPerYear}
            suffix=" days"
            duration={2000}
            startDelay={500}
            style={{
              fontSize: 56,
              fontWeight: '800',
              color: COLORS.error,
              letterSpacing: -2,
            }}
          />
          <Text style={{
            fontSize: 16,
            color: colors.textSecondary,
            marginTop: 4,
          }}>
            looking at your phone <Text style={{fontWeight: 'bold', color: colors.textPrimary}}>THIS YEAR</Text>
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={800}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: 0,
          }}>
            That's approximately
          </Text>
          <AnimatedCounter
            value={yearsPerLife}
            suffix=" years"
            duration={2000}
            startDelay={1000}
            style={{
              fontSize: 72,
              fontWeight: '800',
              color: COLORS.error,
              letterSpacing: -3,
            }}
          />
          <Text style={{
            fontSize: 16,
            color: colors.textSecondary,
            marginTop: 4,
          }}>
            of your life
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={1200}>
        <GlassCard variant="light" style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            fontStyle: 'italic',
          }}>
            Yes, you read this right. You spend the majority of your free time looking at your phone while you could achieve your goals and live the life you want.
          </Text>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={1400}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark ? '#FFFFFF' : '#000000',
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#000000' : '#FFFFFF' }}>
            What's the good news?
          </Text>
        </TouchableOpacity>
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
  const hours = userAnswers.dailyHours;
  const savedYears = Math.round((hours * 0.6 * 365 * 50) / (24 * 365));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <GlassCard style={{ marginBottom: 24, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
          <LinearGradient
            colors={GRADIENT_COLORS.success}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 20,
              alignSelf: 'center',
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 1,
            }}>
              THE GOOD NEWS
            </Text>
          </LinearGradient>
        </GlassCard>
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
          LockIn can help you get back
        </Text>
      </FadeInView>

      <FadeInView delay={400}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <AnimatedCounter
            value={savedYears}
            prefix="+"
            suffix=" years"
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
            of your life
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
          And turn them into the things you always wanted to achieve.{'\n\n'}
          More time for your goals, your passions, and the people you love.
        </Text>
      </FadeInView>

      <FadeInView delay={1000}>
        <GradientButton
          onPress={onContinue}
          title="Let's Get Started"
          colors={GRADIENT_COLORS.success}
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
  const { colors } = useOnboardingTheme();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{ alignSelf: 'center', marginBottom: 36 }}>
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
          Let's take the first step
        </Text>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={{
          fontSize: 17,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 40,
          lineHeight: 26,
        }}>
          LockIn will connect to your screen time to give you a{' '}
          <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
            personalized focus report
          </Text>
        </Text>
      </FadeInView>

      <FadeInView delay={300}>
        <View style={{ marginBottom: 40, paddingHorizontal: 8 }}>
          {[
            'See your real usage data',
            'Get personalized recommendations',
            'Track your progress over time',
          ].map((text, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
            }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#10b981',
                marginRight: 14,
              }} />
              <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '500' }}>
                {text}
              </Text>
            </View>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={400}>
        <GradientButton
          onPress={onContinue}
          title="Continue"
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
  const [isChecking, setIsChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

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
        const granted = await hasUsageStatsPermission();
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
    { icon: '📊', title: 'Track Your Usage', description: 'See which apps you use most and for how long' },
    { icon: '📈', title: 'Monitor Progress', description: 'Track your digital wellness journey over time' },
    { icon: '🎯', title: 'Personalized Insights', description: 'Get recommendations based on your habits' },
    { icon: '🔔', title: 'Smart Alerts', description: 'Know when you\'re spending too much time on an app' },
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
          Allow LockIn to Monitor Screen Time
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <GlassCard variant="light" style={{ marginBottom: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Shield size={20} color={COLORS.success} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: COLORS.success, flex: 1, fontWeight: '500' }}>
              100% of info is secure and stays on your phone
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
              {['Find "LockIn" in the list of apps', 'Toggle "Permit usage access"'].map((step, i) => (
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

// Due to file size limits, remaining steps (9-15) are in StepsRemaining.tsx
