/**
 * SELLING ONBOARDING
 *
 * Psychology-based onboarding that converts users to paying customers.
 * Uses the Value Equation: (Desired Outcome × Likelihood) / (Time Delay × Effort)
 *
 * Flow (17 steps):
 *
 * PERSONALIZATION (1-4):
 * 1. Name (personalization)
 * 2. Age (for accurate life calculations)
 * 3. Main struggle identification
 * 4. Daily hours (estimated)
 *
 * PERMISSIONS (5-9):
 * 5. Permissions intro ("Let's set things up")
 * 6. Usage Stats permission (get REAL usage data)
 * 7. Notification permission (for AI coach nudges)
 * 8. Blocking permissions (Overlay + Accessibility)
 * 9. Notification blocking (block notifications from other apps - OPTIONAL)
 *
 * DEEP QUESTIONS (10-12):
 * 10. Worst apps (useful data + commitment)
 * 11. Goal setting (what they want to achieve)
 * 12. Commitment level (psychological investment)
 *
 * CONVERSION (13-17):
 * 13. Fear activation (lost years based on REAL data)
 * 14. Social proof
 * 15. Transformation & Chart (parabolic improvement)
 * 16. Personalized plan
 * 17. Paywall
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {
  Clock,
  Sparkles,
  Shield,
  CheckCircle,
  Crown,
  ChevronRight,
  User,
  Bell,
  Eye,
  BarChart3,
  Lock,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { hasUsageStatsPermission, openUsageStatsSettings, getTodayUsageStats } from '@/modules/usage-stats';
import { hasOverlayPermission, openOverlaySettings, isAccessibilityServiceEnabled, openAccessibilitySettings, hasNotificationAccess, openNotificationSettings } from '@/modules/app-blocker';
import * as Notifications from 'expo-notifications';
import { BellOff } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ============================================
// ANIMATED COMPONENTS
// ============================================

const AnimatedCounter = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  style,
  startDelay = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  style?: any;
  startDelay?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        useNativeDriver: false,
      }).start();

      const listener = animatedValue.addListener(({ value: v }) => {
        setDisplayValue(Math.round(v));
      });

      return () => animatedValue.removeListener(listener);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <Text style={style}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
};

const AnimatedProgressBar = ({
  progress,
  color,
  delay = 0,
  isDark,
}: {
  progress: number;
  color: string;
  delay?: number;
  isDark: boolean;
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(widthAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [progress]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{
      height: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <Animated.View
        style={{
          height: '100%',
          width: animatedWidth,
          backgroundColor: color,
          borderRadius: 4,
        }}
      />
    </View>
  );
};

// Parabolic Improvement Chart - Shows transformation journey
const ParabolicChart = ({
  isDark,
  weeks = 8,
  dailyHours = 4,
}: {
  isDark: boolean;
  weeks?: number;
  dailyHours?: number;
}) => {
  const chartHeight = 220;
  const chartWidth = width - 64;

  // Generate parabolic improvement data
  // Shows hours SAVED (starts at 0, grows parabolically)
  const generateData = () => {
    const data = [];
    const maxSaved = dailyHours * 0.8; // Can save up to 80% of wasted time

    for (let i = 0; i <= weeks; i++) {
      // Parabolic growth: starts slow, accelerates
      const progress = Math.pow(i / weeks, 1.5);
      const hoursSaved = Math.round(progress * maxSaved * 10) / 10;
      data.push({
        week: i,
        hoursSaved,
        percentage: Math.round(progress * 100),
      });
    }
    return data;
  };

  const data = generateData();

  return (
    <View style={{
      marginVertical: 24,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderRadius: 20,
      padding: 20,
      marginHorizontal: -4,
    }}>
      {/* Chart Title */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: isDark ? '#ffffff' : '#111827',
          marginBottom: 4,
        }}>
          Your projected progress
        </Text>
        <Text style={{
          fontSize: 12,
          color: isDark ? '#6b7280' : '#9ca3af',
        }}>
          Hours saved per day
        </Text>
      </View>

      {/* Chart */}
      <View style={{ height: chartHeight, flexDirection: 'row' }}>
        {/* Y-axis */}
        <View style={{ width: 36, justifyContent: 'space-between', paddingVertical: 8 }}>
          <Text style={{ fontSize: 10, color: isDark ? '#6b7280' : '#9ca3af', textAlign: 'right' }}>
            {Math.round(dailyHours * 0.8)}h
          </Text>
          <Text style={{ fontSize: 10, color: isDark ? '#6b7280' : '#9ca3af', textAlign: 'right' }}>
            {Math.round(dailyHours * 0.4)}h
          </Text>
          <Text style={{ fontSize: 10, color: isDark ? '#6b7280' : '#9ca3af', textAlign: 'right' }}>
            0h
          </Text>
        </View>

        {/* Chart area */}
        <View style={{ flex: 1, marginLeft: 8 }}>
          {/* Grid lines */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />

          {/* Bars */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', paddingHorizontal: 4 }}>
            {data.map((point, index) => {
              const maxHeight = chartHeight - 16;
              const barHeight = useRef(new Animated.Value(0)).current;
              const targetHeight = index === 0
                ? 12 // Minimum height for "Now" to be visible
                : (point.percentage / 100) * maxHeight;

              useEffect(() => {
                Animated.timing(barHeight, {
                  toValue: targetHeight,
                  duration: 600,
                  delay: 200 + index * 80,
                  useNativeDriver: false,
                }).start();
              }, []);

              const isNow = index === 0;
              const isLast = index === data.length - 1;

              return (
                <View key={index} style={{ flex: 1, alignItems: 'center', marginHorizontal: 2 }}>
                  {/* Value label on top of bar */}
                  {(isNow || isLast || index === Math.floor(weeks / 2)) && (
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '600',
                      color: isNow ? '#ef4444' : '#22c55e',
                      marginBottom: 4,
                      opacity: 0.9,
                    }}>
                      {isNow ? `${dailyHours}h` : `+${point.hoursSaved}h`}
                    </Text>
                  )}
                  <Animated.View
                    style={{
                      width: '75%',
                      height: barHeight,
                      backgroundColor: isNow ? '#ef4444' : '#22c55e',
                      borderRadius: 6,
                      opacity: isNow ? 1 : (0.4 + (index / weeks) * 0.6),
                    }}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', marginLeft: 44, marginTop: 8 }}>
        {data.map((point, index) => (
          <View key={index} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontSize: 9,
              color: index === 0 ? '#ef4444' : (isDark ? '#6b7280' : '#9ca3af'),
              fontWeight: index === 0 ? '600' : '400',
            }}>
              {index === 0 ? 'NOW' : `W${index}`}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        gap: 32,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#ef4444', marginRight: 8 }} />
          <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Current</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#22c55e', marginRight: 8 }} />
          <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>With Focus</Text>
        </View>
      </View>
    </View>
  );
};

const FadeInView = ({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: any }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// PERSONALIZATION STATE
// ============================================

interface UserAnswers {
  name: string;
  age: number;
  mainStruggle: string;
  dailyHours: number;
  realDailyHours: number | null; // From usage stats permission
  worstApps: string[];
  goal: string;
  commitmentLevel: string;
}

// ============================================
// STEP COMPONENTS (Minimal Style)
// ============================================

// STEP 1: What's Your Name?
const Step1Name = ({
  onSubmit,
  isDark,
}: {
  onSubmit: (name: string) => void;
  isDark: boolean;
}) => {
  const [name, setName] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInView delay={0}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: 32,
          }}>
            <User size={36} color={isDark ? '#ffffff' : '#111827'} />
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#111827',
            textAlign: 'center',
            marginBottom: 12,
          }}>
            How can we call you?
          </Text>
        </FadeInView>

        <FadeInView delay={200}>
          <Text style={{
            fontSize: 16,
            color: isDark ? '#9ca3af' : '#6b7280',
            textAlign: 'center',
            marginBottom: 40,
          }}>
            Let's make this personal
          </Text>
        </FadeInView>

        <FadeInView delay={300}>
          <TextInput
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
              borderRadius: 16,
              padding: 18,
              fontSize: 18,
              color: isDark ? '#ffffff' : '#111827',
              textAlign: 'center',
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            }}
            placeholder="Your name"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
          />
        </FadeInView>

        <FadeInView delay={400}>
          <TouchableOpacity
            onPress={() => name.trim() && onSubmit(name.trim())}
            disabled={!name.trim()}
            activeOpacity={0.8}
            style={{
              backgroundColor: name.trim() ? (isDark ? '#ffffff' : '#111827') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
              marginTop: 24,
            }}
          >
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: name.trim() ? (isDark ? '#000000' : '#ffffff') : (isDark ? '#6b7280' : '#9ca3af'),
            }}>
              Continue
            </Text>
          </TouchableOpacity>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// STEP 2: How Old Are You?
const Step2Age = ({
  name,
  onSelect,
  isDark,
}: {
  name: string;
  onSelect: (age: number) => void;
  isDark: boolean;
}) => {
  const ageRanges = [
    { age: 18, label: '13-20', display: 'Teenager' },
    { age: 25, label: '21-30', display: '20s' },
    { age: 35, label: '31-40', display: '30s' },
    { age: 45, label: '41-50', display: '40s' },
    { age: 55, label: '50+', display: '50+' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          Nice to meet you, {name}!
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 40,
        }}>
          How old are you?
        </Text>
      </FadeInView>

      <View style={{ gap: 12 }}>
        {ageRanges.map((item, index) => (
          <FadeInView key={item.age} delay={200 + index * 80}>
            <TouchableOpacity
              onPress={() => onSelect(item.age)}
              activeOpacity={0.8}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#111827',
              }}>
                {item.label}
              </Text>
              <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
            </TouchableOpacity>
          </FadeInView>
        ))}
      </View>
    </ScrollView>
  );
};

// STEP 3: What's Your Struggle?
const Step3Struggle = ({
  name,
  onSelect,
  isDark,
}: {
  name: string;
  onSelect: (struggle: string) => void;
  isDark: boolean;
}) => {
  const options = [
    { id: 'productivity', label: "I waste hours scrolling", emoji: '⏰' },
    { id: 'focus', label: "I can't focus on important things", emoji: '🎯' },
    { id: 'sleep', label: "I scroll late at night", emoji: '🌙' },
    { id: 'anxiety', label: "Social media affects my mood", emoji: '😔' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          What brings you here, {name}?
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 40,
        }}>
          Be honest — this helps us help you
        </Text>
      </FadeInView>

      <View style={{ gap: 12 }}>
        {options.map((option, index) => (
          <FadeInView key={option.id} delay={200 + index * 80}>
            <TouchableOpacity
              onPress={() => onSelect(option.id)}
              activeOpacity={0.8}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 16 }}>{option.emoji}</Text>
              <Text style={{
                flex: 1,
                fontSize: 16,
                fontWeight: '500',
                color: isDark ? '#ffffff' : '#111827',
              }}>
                {option.label}
              </Text>
              <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
            </TouchableOpacity>
          </FadeInView>
        ))}
      </View>
    </ScrollView>
  );
};

// STEP 4: How Many Hours?
const Step4Hours = ({
  onSelect,
  isDark,
}: {
  onSelect: (hours: number) => void;
  isDark: boolean;
}) => {
  const options = [
    { hours: 2, label: '1-2 hours' },
    { hours: 4, label: '3-4 hours' },
    { hours: 6, label: '5-6 hours' },
    { hours: 8, label: '7+ hours' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          Daily screen time?
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 40,
        }}>
          On social media & entertainment apps
        </Text>
      </FadeInView>

      <View style={{ gap: 12 }}>
        {options.map((option, index) => (
          <FadeInView key={option.hours} delay={200 + index * 80}>
            <TouchableOpacity
              onPress={() => onSelect(option.hours)}
              activeOpacity={0.8}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#111827',
              }}>
                {option.label}
              </Text>
              <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
            </TouchableOpacity>
          </FadeInView>
        ))}
      </View>
    </ScrollView>
  );
};

// ============================================
// PERMISSION STEPS
// ============================================

// STEP 5: Permissions Intro
const Step5PermissionsIntro = ({
  name,
  onContinue,
  isDark,
}: {
  name: string;
  onContinue: () => void;
  isDark: boolean;
}) => {
  const permissions = [
    {
      icon: BarChart3,
      title: 'Screen Time Access',
      desc: 'See your real usage data',
      difficulty: 'Quick',
    },
    {
      icon: Bell,
      title: 'Notifications',
      desc: 'Get focus reminders',
      difficulty: 'Quick',
    },
    {
      icon: Lock,
      title: 'App Blocking',
      desc: 'Block distracting apps',
      difficulty: '2 steps',
    },
    {
      icon: BellOff,
      title: 'Block App Notifications',
      desc: 'Silence distracting apps',
      difficulty: 'Optional',
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Let's set things up
        </Text>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          {name}, we need a few permissions to help you
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
          borderRadius: 16,
          padding: 4,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }}>
          {permissions.map((perm, index) => {
            const Icon = perm.icon;
            return (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderBottomWidth: index < permissions.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Icon size={22} color={isDark ? '#ffffff' : '#111827'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: isDark ? '#ffffff' : '#111827',
                    marginBottom: 2,
                  }}>
                    {perm.title}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: isDark ? '#6b7280' : '#9ca3af',
                  }}>
                    {perm.desc}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}>
                  <Text style={{
                    fontSize: 11,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    fontWeight: '500',
                  }}>
                    {perm.difficulty}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <View style={{
          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 24,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Shield size={18} color="#22c55e" style={{ marginRight: 10 }} />
          <Text style={{
            fontSize: 13,
            color: '#22c55e',
            flex: 1,
          }}>
            Your data stays on your device. Always.
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={300}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark ? '#ffffff' : '#111827',
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? '#000000' : '#ffffff',
          }}>
            Let's go
          </Text>
        </TouchableOpacity>
      </FadeInView>
    </ScrollView>
  );
};

// STEP 6: Usage Stats Permission
const Step6UsagePermission = ({
  name,
  onGranted,
  onSkip,
  isDark,
}: {
  name: string;
  onGranted: (realHours: number) => void;
  onSkip: () => void;
  isDark: boolean;
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await hasUsageStatsPermission();
    setHasPermission(granted);
    if (granted) {
      await fetchRealData();
    }
  };

  const fetchRealData = async () => {
    try {
      const stats = await getTodayUsageStats();
      const realHours = Math.round(stats.totalScreenTime / 60 / 60 * 10) / 10;
      onGranted(realHours);
    } catch (e) {
      onGranted(0);
    }
  };

  const handleGrantPermission = async () => {
    setIsChecking(true);
    openUsageStatsSettings();
  };

  // Check permission when app becomes active (user returns from settings)
  useEffect(() => {
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

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          marginBottom: 24,
        }}>
          <BarChart3 size={36} color="#3b82f6" />
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          See your real screen time
        </Text>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 22,
        }}>
          {name}, let us show you exactly how much time you spend on your phone each day
        </Text>
      </FadeInView>

      {hasPermission ? (
        <FadeInView delay={200}>
          <View style={{
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <CheckCircle size={32} color="#22c55e" style={{ marginBottom: 12 }} />
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#22c55e',
            }}>
              Permission granted!
            </Text>
          </View>
        </FadeInView>
      ) : (
        <>
          <FadeInView delay={200}>
            <View style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}>
              <Text style={{
                fontSize: 13,
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                marginBottom: 12,
              }}>
                How to enable:
              </Text>
              <View style={{ gap: 8 }}>
                {['Find "LockIn" in the list', 'Toggle it ON', 'Come back here'].map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#ffffff' : '#111827' }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: isDark ? '#d1d5db' : '#374151' }}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={300}>
            <TouchableOpacity
              onPress={handleGrantPermission}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#3b82f6',
                borderRadius: 16,
                padding: 18,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                {isChecking ? 'Checking...' : 'Open Settings'}
              </Text>
            </TouchableOpacity>
          </FadeInView>

          <FadeInView delay={400}>
            <TouchableOpacity
              onPress={onSkip}
              activeOpacity={0.7}
              style={{ padding: 12, alignItems: 'center' }}
            >
              <Text style={{
                fontSize: 14,
                color: isDark ? '#6b7280' : '#9ca3af',
              }}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
};

// STEP 7: Notification Permission
const Step7NotificationPermission = ({
  name,
  onContinue,
  isDark,
}: {
  name: string;
  onContinue: () => void;
  isDark: boolean;
}) => {
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
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          marginBottom: 24,
        }}>
          <Bell size={36} color="#a855f7" />
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Stay on track
        </Text>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 22,
        }}>
          Get gentle nudges when you're scrolling too long. Our AI coach will help you stay focused.
        </Text>
      </FadeInView>

      {hasPermission ? (
        <FadeInView delay={200}>
          <View style={{
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <CheckCircle size={32} color="#22c55e" style={{ marginBottom: 12 }} />
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#22c55e',
            }}>
              Notifications enabled!
            </Text>
          </View>
          <TouchableOpacity
            onPress={onContinue}
            activeOpacity={0.8}
            style={{
              backgroundColor: isDark ? '#ffffff' : '#111827',
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: isDark ? '#000000' : '#ffffff',
            }}>
              Continue
            </Text>
          </TouchableOpacity>
        </FadeInView>
      ) : (
        <>
          <FadeInView delay={200}>
            <TouchableOpacity
              onPress={handleGrantPermission}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#a855f7',
                borderRadius: 16,
                padding: 18,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                Enable Notifications
              </Text>
            </TouchableOpacity>
          </FadeInView>

          <FadeInView delay={300}>
            <TouchableOpacity
              onPress={onContinue}
              activeOpacity={0.7}
              style={{ padding: 12, alignItems: 'center' }}
            >
              <Text style={{
                fontSize: 14,
                color: isDark ? '#6b7280' : '#9ca3af',
              }}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
};

// STEP 8: Blocking Permissions (Overlay + Accessibility)
const Step8BlockingPermissions = ({
  name,
  onContinue,
  isDark,
}: {
  name: string;
  onContinue: () => void;
  isDark: boolean;
}) => {
  const [overlayGranted, setOverlayGranted] = useState(false);
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);
  const [isChecking, setIsChecking] = useState<'overlay' | 'accessibility' | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const [overlay, accessibility] = await Promise.all([
      hasOverlayPermission(),
      isAccessibilityServiceEnabled(),
    ]);
    setOverlayGranted(overlay);
    setAccessibilityGranted(accessibility);
  };

  // Check when returning from settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && isChecking) {
        await checkPermissions();
        setIsChecking(null);
      }
    });
    return () => subscription.remove();
  }, [isChecking]);

  const handleOverlay = () => {
    setIsChecking('overlay');
    openOverlaySettings();
  };

  const handleAccessibility = () => {
    setIsChecking('accessibility');
    openAccessibilitySettings();
  };

  const allGranted = overlayGranted && accessibilityGranted;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          marginBottom: 24,
        }}>
          <Lock size={36} color="#ef4444" />
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Enable app blocking
        </Text>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 22,
        }}>
          These permissions let us actually block apps when you want to focus.
        </Text>
      </FadeInView>

      {/* Permission Cards */}
      <FadeInView delay={200}>
        <View style={{ gap: 12, marginBottom: 24 }}>
          {/* Overlay Permission */}
          <TouchableOpacity
            onPress={overlayGranted ? undefined : handleOverlay}
            activeOpacity={overlayGranted ? 1 : 0.8}
            style={{
              backgroundColor: overlayGranted
                ? (isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)')
                : (isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'),
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: overlayGranted
                ? 'rgba(34, 197, 94, 0.3)'
                : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
            }}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: overlayGranted ? 'rgba(34, 197, 94, 0.15)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              {overlayGranted ? (
                <CheckCircle size={22} color="#22c55e" />
              ) : (
                <Eye size={22} color={isDark ? '#ffffff' : '#111827'} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: overlayGranted ? '#22c55e' : (isDark ? '#ffffff' : '#111827'),
                marginBottom: 2,
              }}>
                Display over apps
              </Text>
              <Text style={{
                fontSize: 13,
                color: isDark ? '#6b7280' : '#9ca3af',
              }}>
                {overlayGranted ? 'Enabled' : 'Shows block screen'}
              </Text>
            </View>
            {!overlayGranted && (
              <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
            )}
          </TouchableOpacity>

          {/* Accessibility Permission */}
          <TouchableOpacity
            onPress={accessibilityGranted ? undefined : handleAccessibility}
            activeOpacity={accessibilityGranted ? 1 : 0.8}
            style={{
              backgroundColor: accessibilityGranted
                ? (isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)')
                : (isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'),
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: accessibilityGranted
                ? 'rgba(34, 197, 94, 0.3)'
                : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
            }}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: accessibilityGranted ? 'rgba(34, 197, 94, 0.15)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              {accessibilityGranted ? (
                <CheckCircle size={22} color="#22c55e" />
              ) : (
                <Shield size={22} color={isDark ? '#ffffff' : '#111827'} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: accessibilityGranted ? '#22c55e' : (isDark ? '#ffffff' : '#111827'),
                marginBottom: 2,
              }}>
                Accessibility service
              </Text>
              <Text style={{
                fontSize: 13,
                color: isDark ? '#6b7280' : '#9ca3af',
              }}>
                {accessibilityGranted ? 'Enabled' : 'Detects app launches'}
              </Text>
            </View>
            {!accessibilityGranted && (
              <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
            )}
          </TouchableOpacity>
        </View>
      </FadeInView>

      <FadeInView delay={300}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          style={{
            backgroundColor: allGranted ? (isDark ? '#ffffff' : '#111827') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: allGranted ? (isDark ? '#000000' : '#ffffff') : (isDark ? '#9ca3af' : '#6b7280'),
          }}>
            {allGranted ? 'Continue' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
      </FadeInView>

      {!allGranted && (
        <FadeInView delay={400}>
          <Text style={{
            fontSize: 12,
            color: isDark ? '#4b5563' : '#9ca3af',
            textAlign: 'center',
            marginTop: 16,
          }}>
            You can enable these later in Settings
          </Text>
        </FadeInView>
      )}
    </ScrollView>
  );
};

// STEP 9: Notification Blocking (Optional - block notifications from other apps)
const Step9NotificationBlocking = ({
  name,
  onContinue,
  isDark,
}: {
  name: string;
  onContinue: () => void;
  isDark: boolean;
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await hasNotificationAccess();
    setHasAccess(granted);
  };

  // Check when returning from settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && isChecking) {
        const granted = await hasNotificationAccess();
        setHasAccess(granted);
        setIsChecking(false);
      }
    });
    return () => subscription.remove();
  }, [isChecking]);

  const handleGrant = () => {
    setIsChecking(true);
    openNotificationSettings();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          marginBottom: 24,
        }}>
          <BellOff size={36} color="#f97316" />
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Block distracting notifications
        </Text>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 8,
          lineHeight: 22,
        }}>
          Stop Instagram, TikTok, and other apps from interrupting your focus.
        </Text>
        <Text style={{
          fontSize: 13,
          color: isDark ? '#6b7280' : '#9ca3af',
          textAlign: 'center',
          marginBottom: 32,
          fontStyle: 'italic',
        }}>
          This is optional but highly recommended
        </Text>
      </FadeInView>

      {hasAccess ? (
        <FadeInView delay={200}>
          <View style={{
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <CheckCircle size={32} color="#22c55e" style={{ marginBottom: 12 }} />
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#22c55e',
            }}>
              Notification access enabled!
            </Text>
          </View>
          <TouchableOpacity
            onPress={onContinue}
            activeOpacity={0.8}
            style={{
              backgroundColor: isDark ? '#ffffff' : '#111827',
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: isDark ? '#000000' : '#ffffff',
            }}>
              Continue
            </Text>
          </TouchableOpacity>
        </FadeInView>
      ) : (
        <>
          <FadeInView delay={200}>
            <View style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}>
              <Text style={{
                fontSize: 13,
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                marginBottom: 12,
              }}>
                How to enable:
              </Text>
              <View style={{ gap: 8 }}>
                {['Find "LockIn" in the list', 'Toggle it ON', 'Confirm if prompted'].map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#ffffff' : '#111827' }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: isDark ? '#d1d5db' : '#374151' }}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={300}>
            <TouchableOpacity
              onPress={handleGrant}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#f97316',
                borderRadius: 16,
                padding: 18,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                {isChecking ? 'Checking...' : 'Open Settings'}
              </Text>
            </TouchableOpacity>
          </FadeInView>

          <FadeInView delay={400}>
            <TouchableOpacity
              onPress={onContinue}
              activeOpacity={0.7}
              style={{ padding: 12, alignItems: 'center' }}
            >
              <Text style={{
                fontSize: 14,
                color: isDark ? '#6b7280' : '#9ca3af',
              }}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
};

// App icons from assets
const APP_ICONS: { [key: string]: any } = {
  instagram: require('@/assets/icons/instagram.png'),
  tiktok: require('@/assets/icons/tiktok.png'),
  youtube: require('@/assets/icons/youtube.png'),
  twitter: require('@/assets/icons/x.png'),
  facebook: require('@/assets/icons/facebook.png'),
  telegram: require('@/assets/icons/telegram.png'),
  pinterest: require('@/assets/icons/pinterest.png'),
  other: null, // Use emoji instead
};

// STEP 5: Worst Apps Selection (useful data + commitment)
const Step5WorstApps = ({
  name,
  onSelect,
  isDark,
}: {
  name: string;
  onSelect: (apps: string[]) => void;
  isDark: boolean;
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  const apps = [
    { id: 'instagram', name: 'Instagram' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'youtube', name: 'YouTube' },
    { id: 'twitter', name: 'X (Twitter)' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'telegram', name: 'Telegram' },
    { id: 'pinterest', name: 'Pinterest' },
    { id: 'other', name: 'Other apps' },
  ];

  const toggleApp = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(a => a !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          Which apps steal your time?
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          Select all that apply, {name}
        </Text>
      </FadeInView>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {apps.map((app, index) => {
          const isSelected = selected.includes(app.id);
          return (
            <FadeInView key={app.id} delay={150 + index * 50}>
              <TouchableOpacity
                onPress={() => toggleApp(app.id)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isSelected
                    ? (isDark ? 'rgba(255,255,255,0.15)' : '#111827')
                    : (isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'),
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: isSelected
                    ? (isDark ? 'rgba(255,255,255,0.3)' : '#111827')
                    : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                }}
              >
                {APP_ICONS[app.id] ? (
                  <Image
                    source={APP_ICONS[app.id]}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      marginRight: 10,
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 20, marginRight: 10 }}>📱</Text>
                )}
                <Text style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: isSelected
                    ? (isDark ? '#ffffff' : '#ffffff')
                    : (isDark ? '#ffffff' : '#111827'),
                }}>
                  {app.name}
                </Text>
              </TouchableOpacity>
            </FadeInView>
          );
        })}
      </View>

      {selected.length > 0 && (
        <FadeInView delay={600}>
          <TouchableOpacity
            onPress={() => onSelect(selected)}
            activeOpacity={0.8}
            style={{
              backgroundColor: isDark ? '#ffffff' : '#111827',
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
              marginTop: 32,
            }}
          >
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: isDark ? '#000000' : '#ffffff',
            }}>
              Continue ({selected.length} selected)
            </Text>
          </TouchableOpacity>
        </FadeInView>
      )}
    </ScrollView>
  );
};

// STEP 6: Goal Setting
const Step6Goal = ({
  name,
  onSelect,
  isDark,
}: {
  name: string;
  onSelect: (goal: string) => void;
  isDark: boolean;
}) => {
  const goals = [
    { id: 'productivity', label: 'Be more productive', emoji: '🚀', desc: 'Get more done in less time' },
    { id: 'sleep', label: 'Sleep better', emoji: '😴', desc: 'Stop late-night scrolling' },
    { id: 'presence', label: 'Be more present', emoji: '🧘', desc: 'Connect with people around me' },
    { id: 'mental', label: 'Improve mental health', emoji: '🧠', desc: 'Reduce anxiety and comparison' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          What's your main goal?
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          We'll personalize your experience, {name}
        </Text>
      </FadeInView>

      <View style={{ gap: 12 }}>
        {goals.map((goal, index) => (
          <FadeInView key={goal.id} delay={200 + index * 80}>
            <TouchableOpacity
              onPress={() => onSelect(goal.id)}
              activeOpacity={0.8}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                borderRadius: 16,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
                <Text style={{ fontSize: 24 }}>{goal.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#ffffff' : '#111827',
                  marginBottom: 2,
                }}>
                  {goal.label}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: isDark ? '#6b7280' : '#9ca3af',
                }}>
                  {goal.desc}
                </Text>
              </View>
              <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
            </TouchableOpacity>
          </FadeInView>
        ))}
      </View>
    </ScrollView>
  );
};

// STEP 7: Commitment Level (psychological investment)
const Step7Commitment = ({
  name,
  onSelect,
  isDark,
}: {
  name: string;
  onSelect: (level: string) => void;
  isDark: boolean;
}) => {
  const levels = [
    { id: 'curious', label: 'Just curious', emoji: '🤔', desc: "I want to see what this is about" },
    { id: 'ready', label: 'Ready to try', emoji: '💪', desc: "I'm willing to make changes" },
    { id: 'committed', label: '100% committed', emoji: '🔥', desc: "I'm done wasting my life scrolling" },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          How committed are you?
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          Be honest with yourself, {name}
        </Text>
      </FadeInView>

      <View style={{ gap: 12 }}>
        {levels.map((level, index) => (
          <FadeInView key={level.id} delay={200 + index * 100}>
            <TouchableOpacity
              onPress={() => onSelect(level.id)}
              activeOpacity={0.8}
              style={{
                backgroundColor: level.id === 'committed'
                  ? (isDark ? 'rgba(255,255,255,0.1)' : '#111827')
                  : (isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'),
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: level.id === 'committed' ? 2 : 1,
                borderColor: level.id === 'committed'
                  ? (isDark ? 'rgba(255,255,255,0.3)' : '#111827')
                  : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
              }}
            >
              <Text style={{ fontSize: 28, marginRight: 16 }}>{level.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: level.id === 'committed'
                    ? (isDark ? '#ffffff' : '#ffffff')
                    : (isDark ? '#ffffff' : '#111827'),
                  marginBottom: 2,
                }}>
                  {level.label}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: level.id === 'committed'
                    ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.8)')
                    : (isDark ? '#6b7280' : '#9ca3af'),
                }}>
                  {level.desc}
                </Text>
              </View>
            </TouchableOpacity>
          </FadeInView>
        ))}
      </View>

      <FadeInView delay={600}>
        <Text style={{
          fontSize: 12,
          color: isDark ? '#4b5563' : '#9ca3af',
          textAlign: 'center',
          marginTop: 24,
        }}>
          Don't worry — we meet you where you are
        </Text>
      </FadeInView>
    </ScrollView>
  );
};

// STEP 8: The Reality Check (Fear - with accurate age-based calculation)
const Step8Fear = ({
  userAnswers,
  onContinue,
  isDark,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
  isDark: boolean;
}) => {
  // Calculate remaining years based on age (assuming ~80 life expectancy)
  const remainingYears = Math.max(80 - userAnswers.age, 20);

  // Calculate years spent scrolling from remaining life
  const yearsScrolling = Math.round((userAnswers.dailyHours * 365 * remainingYears) / (24 * 365));

  // Life breakdown for their remaining years
  const sleepYears = Math.round(remainingYears * 0.33);
  const workYears = Math.round(remainingYears * 0.25);
  const essentialYears = Math.round(remainingYears * 0.15);
  const freeYears = remainingYears - sleepYears - workYears - essentialYears;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          {userAnswers.name}, let's face the truth
        </Text>
      </FadeInView>

      <FadeInView delay={200}>
        <View style={{
          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          borderRadius: 20,
          padding: 28,
          alignItems: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: 'rgba(239, 68, 68, 0.2)',
        }}>
          <Text style={{
            fontSize: 15,
            color: isDark ? '#fca5a5' : '#dc2626',
            marginBottom: 8,
          }}>
            At {userAnswers.dailyHours}h/day, you'll spend
          </Text>
          <AnimatedCounter
            value={yearsScrolling}
            suffix=" years"
            duration={2000}
            startDelay={400}
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: '#ef4444',
            }}
          />
          <Text style={{
            fontSize: 16,
            color: isDark ? '#fca5a5' : '#dc2626',
            marginTop: 4,
          }}>
            of your remaining life scrolling
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={600}>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          Out of ~{freeYears} years of free time you have left...{'\n'}
          scrolling takes almost all of it.
        </Text>
      </FadeInView>

      <FadeInView delay={800}>
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#ffffff' : '#111827',
            marginBottom: 16,
          }}>
            Your remaining ~{remainingYears} years:
          </Text>

          {[
            { label: 'Sleep', years: sleepYears, color: '#6366f1' },
            { label: 'Work', years: workYears, color: '#8b5cf6' },
            { label: 'Essentials', years: essentialYears, color: '#a855f7' },
            { label: 'Scrolling', years: yearsScrolling, color: '#ef4444' },
            { label: 'Actually living', years: Math.max(freeYears - yearsScrolling, 0), color: '#22c55e' },
          ].map((item, index) => (
            <View key={item.label} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: isDark ? '#d1d5db' : '#4b5563' }}>{item.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: item.color }}>{item.years}y</Text>
              </View>
              <AnimatedProgressBar
                progress={(item.years / remainingYears) * 100}
                color={item.color}
                delay={1000 + index * 150}
                isDark={isDark}
              />
            </View>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={1400}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark ? '#ffffff' : '#111827',
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? '#000000' : '#ffffff',
          }}>
            I want to change this
          </Text>
        </TouchableOpacity>
      </FadeInView>
    </ScrollView>
  );
};

// STEP 9: You're Not Alone
const Step9SocialProof = ({
  onContinue,
  isDark,
}: {
  onContinue: () => void;
  isDark: boolean;
}) => {
  const stats = [
    { value: 2.4, suffix: 'M', label: 'People struggle' },
    { value: 847, suffix: 'K', label: 'Took action' },
    { value: 94, suffix: '%', label: 'See results' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          You're not alone
        </Text>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 16,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 40,
        }}>
          Millions feel the same way.{'\n'}Hundreds of thousands already changed.
        </Text>
      </FadeInView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 }}>
        {stats.map((stat, index) => (
          <FadeInView key={index} delay={200 + index * 150} style={{ alignItems: 'center' }}>
            <AnimatedCounter
              value={stat.value}
              suffix={stat.suffix}
              duration={1500}
              startDelay={200 + index * 150}
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}
            />
            <Text style={{
              fontSize: 12,
              color: isDark ? '#9ca3af' : '#6b7280',
              marginTop: 4,
            }}>
              {stat.label}
            </Text>
          </FadeInView>
        ))}
      </View>

      <FadeInView delay={600}>
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
        }}>
          {[
            { name: 'Sarah, 24', text: "I was losing 5 hours daily. Now I read books again." },
            { name: 'Mike, 31', text: "My sleep improved within a week." },
            { name: 'Emma, 19', text: "I finally have time for my hobbies." },
          ].map((t, index) => (
            <View key={index} style={{
              paddingVertical: 12,
              borderBottomWidth: index < 2 ? 1 : 0,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }}>
              <Text style={{
                fontSize: 14,
                color: isDark ? '#d1d5db' : '#374151',
                fontStyle: 'italic',
                marginBottom: 4,
              }}>
                "{t.text}"
              </Text>
              <Text style={{
                fontSize: 12,
                color: isDark ? '#6b7280' : '#9ca3af',
              }}>
                — {t.name}
              </Text>
            </View>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={900}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark ? '#ffffff' : '#111827',
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? '#000000' : '#ffffff',
          }}>
            Show me how
          </Text>
        </TouchableOpacity>
      </FadeInView>
    </ScrollView>
  );
};

// STEP 10: Transformation with Parabolic Chart
const Step10Transformation = ({
  userAnswers,
  onContinue,
  isDark,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
  isDark: boolean;
}) => {
  const savedHoursDaily = Math.round(userAnswers.dailyHours * 0.7);
  const savedHoursWeekly = savedHoursDaily * 7;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 6,
        }}>
          Your transformation
        </Text>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {userAnswers.name}, here's what's possible
        </Text>
      </FadeInView>

      {/* Main Chart - Hero element */}
      <FadeInView delay={150}>
        <ParabolicChart isDark={isDark} weeks={8} dailyHours={userAnswers.dailyHours} />
      </FadeInView>

      {/* Stats Row */}
      <FadeInView delay={500}>
        <View style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 24,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }}>
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#22c55e',
            }}>
              {savedHoursWeekly}h
            </Text>
            <Text style={{
              fontSize: 12,
              color: isDark ? '#6b7280' : '#9ca3af',
              marginTop: 2,
            }}>
              saved/week
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }}>
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: isDark ? '#ffffff' : '#111827',
            }}>
              94%
            </Text>
            <Text style={{
              fontSize: 12,
              color: isDark ? '#6b7280' : '#9ca3af',
              marginTop: 2,
            }}>
              see results W1
            </Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={700}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark ? '#ffffff' : '#111827',
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? '#000000' : '#ffffff',
          }}>
            Create my plan
          </Text>
        </TouchableOpacity>
      </FadeInView>
    </ScrollView>
  );
};

// STEP 11: Your Personalized Plan
const Step11Plan = ({
  userAnswers,
  onContinue,
  isDark,
}: {
  userAnswers: UserAnswers;
  onContinue: () => void;
  isDark: boolean;
}) => {
  const targetReduction = Math.round(userAnswers.dailyHours * 0.7);

  // Personalize based on goal
  const goalEmoji = {
    productivity: '🚀',
    sleep: '😴',
    presence: '🧘',
    mental: '🧠',
  }[userAnswers.goal] || '✨';

  const goalText = {
    productivity: 'productivity',
    sleep: 'better sleep',
    presence: 'being present',
    mental: 'mental clarity',
  }[userAnswers.goal] || 'focus';

  // Apps they selected
  const appCount = userAnswers.worstApps.length;

  const planItems = [
    { icon: '🛡️', text: `Block ${appCount} distracting apps automatically` },
    { icon: '⏰', text: 'Smart schedules based on your routine' },
    { icon: '🤖', text: 'AI coach when urges hit' },
    { icon: '📊', text: 'Track your daily progress' },
    { icon: '🎯', text: `Optimized for ${goalText}` },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 6,
        }}>
          Your plan is ready {goalEmoji}
        </Text>
        <Text style={{
          fontSize: 15,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          Personalized for you, {userAnswers.name}
        </Text>
      </FadeInView>

      {/* Goal Card */}
      <FadeInView delay={100}>
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{
              fontSize: 13,
              color: isDark ? '#6b7280' : '#9ca3af',
              marginBottom: 4,
            }}>
              YOUR GOAL
            </Text>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: isDark ? '#ffffff' : '#111827',
            }}>
              Save {targetReduction}+ hrs/day
            </Text>
          </View>
          <View style={{
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}>
            <Text style={{ color: '#22c55e', fontWeight: '600', fontSize: 13 }}>
              Achievable ✓
            </Text>
          </View>
        </View>
      </FadeInView>

      {/* Plan Items */}
      <FadeInView delay={200}>
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
          borderRadius: 16,
          padding: 4,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }}>
          {planItems.map((item, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: index < planItems.length - 1 ? 1 : 0,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }}>
              <Text style={{ fontSize: 20, marginRight: 14 }}>{item.icon}</Text>
              <Text style={{
                fontSize: 15,
                color: isDark ? '#d1d5db' : '#374151',
                flex: 1,
              }}>
                {item.text}
              </Text>
              <CheckCircle size={18} color="#22c55e" />
            </View>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={400}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Clock size={15} color={isDark ? '#6b7280' : '#9ca3af'} style={{ marginRight: 6 }} />
          <Text style={{
            fontSize: 13,
            color: isDark ? '#6b7280' : '#9ca3af',
          }}>
            Ready in under 3 minutes
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={450}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark ? '#ffffff' : '#111827',
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? '#000000' : '#ffffff',
          }}>
            Activate my plan
          </Text>
        </TouchableOpacity>
      </FadeInView>
    </ScrollView>
  );
};

// STEP 12: PAYWALL
const Step12Paywall = ({
  userAnswers,
  isDark,
  onSubscribe,
  onRestore,
  onSkip,
}: {
  userAnswers: UserAnswers;
  isDark: boolean;
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
  onRestore: () => void;
  onSkip: () => void;
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // RevenueCat prices
  const monthlyPrice = 8;
  const yearlyPrice = 40;
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2);
  const savings = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

  // Calculate saved years
  const remainingYears = Math.max(80 - userAnswers.age, 20);
  const currentYearsScrolling = Math.round((userAnswers.dailyHours * 365 * remainingYears) / (24 * 365));
  const savedYears = Math.round(currentYearsScrolling * 0.7);

  const features = [
    'Unlimited app blocking',
    'Smart schedules & limits',
    'AI coaching',
    'Task verification',
    'Detailed analytics',
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 32,
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      }}>
        <FadeInView delay={0}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Crown size={28} color={isDark ? '#ffffff' : '#111827'} />
            </View>
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: isDark ? '#ffffff' : '#111827',
              textAlign: 'center',
              marginBottom: 8,
            }}>
              Get {savedYears}+ years back
            </Text>
            <Text style={{
              fontSize: 15,
              color: isDark ? '#9ca3af' : '#6b7280',
              textAlign: 'center',
            }}>
              Invest in yourself, {userAnswers.name}
            </Text>
          </View>
        </FadeInView>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        {/* Plan Selection */}
        <FadeInView delay={200}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, marginTop: 24 }}>
            {/* Yearly Plan */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: selectedPlan === 'yearly'
                  ? (isDark ? '#ffffff' : '#111827')
                  : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                position: 'relative',
              }}
            >
              {selectedPlan === 'yearly' && (
                <View style={{
                  position: 'absolute',
                  top: -10,
                  right: 12,
                  backgroundColor: '#22c55e',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff' }}>
                    SAVE {savings}%
                  </Text>
                </View>
              )}
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: isDark ? '#9ca3af' : '#6b7280',
                marginBottom: 4,
              }}>
                YEARLY
              </Text>
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}>
                ${yearlyMonthly}
              </Text>
              <Text style={{
                fontSize: 12,
                color: isDark ? '#9ca3af' : '#6b7280',
              }}>
                per month
              </Text>
              <Text style={{
                fontSize: 11,
                color: '#22c55e',
                marginTop: 6,
              }}>
                ${yearlyPrice}/year
              </Text>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: selectedPlan === 'monthly'
                  ? (isDark ? '#ffffff' : '#111827')
                  : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: isDark ? '#9ca3af' : '#6b7280',
                marginBottom: 4,
              }}>
                MONTHLY
              </Text>
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}>
                ${monthlyPrice}
              </Text>
              <Text style={{
                fontSize: 12,
                color: isDark ? '#9ca3af' : '#6b7280',
              }}>
                per month
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Features */}
        <FadeInView delay={400}>
          <View style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
            borderRadius: 16,
            padding: 4,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }}>
            {features.map((feature, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: index < features.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }}>
                <CheckCircle size={18} color="#22c55e" style={{ marginRight: 12 }} />
                <Text style={{
                  fontSize: 15,
                  color: isDark ? '#d1d5db' : '#374151',
                }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* CTA Button */}
        <FadeInView delay={600}>
          <TouchableOpacity
            onPress={() => onSubscribe(selectedPlan)}
            activeOpacity={0.8}
            style={{
              backgroundColor: isDark ? '#ffffff' : '#111827',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#000000' : '#ffffff' }}>
              Start 7-day free trial
            </Text>
            <Text style={{ fontSize: 13, color: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              Cancel anytime
            </Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Guarantee */}
        <FadeInView delay={700}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
          }}>
            <Shield size={16} color={isDark ? '#6b7280' : '#9ca3af'} style={{ marginRight: 6 }} />
            <Text style={{
              fontSize: 13,
              color: isDark ? '#6b7280' : '#9ca3af',
            }}>
              100% Money-Back Guarantee
            </Text>
          </View>
        </FadeInView>

        {/* Restore & Skip */}
        <FadeInView delay={800}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 20 }}>
            <TouchableOpacity onPress={onRestore} style={{ paddingVertical: 12 }}>
              <Text style={{ fontSize: 14, color: isDark ? '#6b7280' : '#9ca3af' }}>
                Restore
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSkip} style={{ paddingVertical: 12 }}>
              <Text style={{ fontSize: 14, color: isDark ? '#6b7280' : '#9ca3af' }}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Terms */}
        <FadeInView delay={900}>
          <Text style={{
            fontSize: 11,
            color: isDark ? '#4b5563' : '#9ca3af',
            textAlign: 'center',
            lineHeight: 16,
            marginTop: 16,
          }}>
            By continuing, you agree to our Terms of Service.{'\n'}
            Subscription renews automatically unless cancelled.
          </Text>
        </FadeInView>
      </View>
    </ScrollView>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function SellingOnboarding() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentStep, setCurrentStep] = useState(1);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({
    name: '',
    age: 25,
    mainStruggle: '',
    dailyHours: 3,
    realDailyHours: null,
    worstApps: [],
    goal: '',
    commitmentLevel: '',
  });

  const totalSteps = 17;
  const progress = (currentStep / totalSteps) * 100;

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    await SecureStore.setItemAsync('sellingOnboardingCompleted', 'true');

    // Navigate to payment with plan info
    router.replace({
      pathname: '/payment',
      params: { plan },
    } as any);
  };

  const handleRestore = async () => {
    await SecureStore.setItemAsync('sellingOnboardingCompleted', 'true');
    try {
      await Purchases.restorePurchases();
    } catch (e) {
      console.log('Restore error:', e);
    }
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync('sellingOnboardingCompleted', 'true');
    router.replace('/(tabs)');
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStep = () => {
    // Use real hours if available, otherwise use estimated
    const effectiveHours = userAnswers.realDailyHours ?? userAnswers.dailyHours;
    const answersWithRealData = { ...userAnswers, dailyHours: effectiveHours };

    switch (currentStep) {
      case 1:
        return (
          <Step1Name
            isDark={isDark}
            onSubmit={(name) => {
              setUserAnswers({ ...userAnswers, name });
              nextStep();
            }}
          />
        );
      case 2:
        return (
          <Step2Age
            name={userAnswers.name}
            isDark={isDark}
            onSelect={(age) => {
              setUserAnswers({ ...userAnswers, age });
              nextStep();
            }}
          />
        );
      case 3:
        return (
          <Step3Struggle
            name={userAnswers.name}
            isDark={isDark}
            onSelect={(struggle) => {
              setUserAnswers({ ...userAnswers, mainStruggle: struggle });
              nextStep();
            }}
          />
        );
      case 4:
        return (
          <Step4Hours
            isDark={isDark}
            onSelect={(hours) => {
              setUserAnswers({ ...userAnswers, dailyHours: hours });
              nextStep();
            }}
          />
        );
      // PERMISSION STEPS (5-8)
      case 5:
        return (
          <Step5PermissionsIntro
            name={userAnswers.name}
            isDark={isDark}
            onContinue={nextStep}
          />
        );
      case 6:
        return (
          <Step6UsagePermission
            name={userAnswers.name}
            isDark={isDark}
            onGranted={(realHours) => {
              setUserAnswers({ ...userAnswers, realDailyHours: realHours });
              nextStep();
            }}
            onSkip={nextStep}
          />
        );
      case 7:
        return (
          <Step7NotificationPermission
            name={userAnswers.name}
            isDark={isDark}
            onContinue={nextStep}
          />
        );
      case 8:
        return (
          <Step8BlockingPermissions
            name={userAnswers.name}
            isDark={isDark}
            onContinue={nextStep}
          />
        );
      case 9:
        return (
          <Step9NotificationBlocking
            name={userAnswers.name}
            isDark={isDark}
            onContinue={nextStep}
          />
        );
      // BACK TO QUESTIONS (10-12)
      case 10:
        return (
          <Step5WorstApps
            name={userAnswers.name}
            isDark={isDark}
            onSelect={(apps) => {
              setUserAnswers({ ...userAnswers, worstApps: apps });
              nextStep();
            }}
          />
        );
      case 11:
        return (
          <Step6Goal
            name={userAnswers.name}
            isDark={isDark}
            onSelect={(goal) => {
              setUserAnswers({ ...userAnswers, goal });
              nextStep();
            }}
          />
        );
      case 12:
        return (
          <Step7Commitment
            name={userAnswers.name}
            isDark={isDark}
            onSelect={(level) => {
              setUserAnswers({ ...userAnswers, commitmentLevel: level });
              nextStep();
            }}
          />
        );
      // FEAR & CONVERSION (13-17)
      case 13:
        return (
          <Step8Fear
            userAnswers={answersWithRealData}
            isDark={isDark}
            onContinue={nextStep}
          />
        );
      case 14:
        return (
          <Step9SocialProof
            isDark={isDark}
            onContinue={nextStep}
          />
        );
      case 15:
        return (
          <Step10Transformation
            userAnswers={answersWithRealData}
            isDark={isDark}
            onContinue={nextStep}
          />
        );
      case 16:
        return (
          <Step11Plan
            userAnswers={answersWithRealData}
            isDark={isDark}
            onContinue={nextStep}
          />
        );
      case 17:
        return (
          <Step12Paywall
            userAnswers={answersWithRealData}
            isDark={isDark}
            onSubscribe={handleSubscribe}
            onRestore={handleRestore}
            onSkip={handleSkip}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
      {/* Progress Bar */}
      {currentStep < 17 && (
        <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 }}>
          <View style={{
            height: 3,
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <View
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: isDark ? '#ffffff' : '#111827',
                borderRadius: 2,
              }}
            />
          </View>
        </View>
      )}

      {/* Step Content */}
      <View style={{ flex: 1 }}>
        {renderStep()}
      </View>
    </View>
  );
}
