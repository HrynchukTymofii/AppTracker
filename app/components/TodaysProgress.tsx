import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Dumbbell, ChevronRight, Target, TrendingUp, Wallet } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useEarnedTime } from '@/context/EarnedTimeContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TodaysProgressProps {
  isDark: boolean;
}

// Weekly Dual-Candle Chart Component (earned + spent per day)
const WeeklyChart = ({
  data,
  isDark,
  accentColor,
  t,
}: {
  data: { day: string; earned: number; spent: number; isToday: boolean }[];
  isDark: boolean;
  accentColor: string;
  t: (key: string) => string;
}) => {
  // Find the max value for scaling - max bar will be full height
  const maxValue = Math.max(...data.map(d => Math.max(d.earned, d.spent)), 1);
  const chartHeight = 70;
  const barMaxHeight = chartHeight - 16; // Leave room for labels
  const barWidth = 10;

  return (
    <View style={{ marginTop: 16 }}>
      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#10b981' }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>{t("progress.earned")}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: accentColor }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>{t("progress.spent")}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: chartHeight }}>
        {data.map((item) => {
          // Scale proportionally - max value gets full height
          const earnedHeight = maxValue > 0 ? (item.earned / maxValue) * barMaxHeight : 0;
          const spentHeight = maxValue > 0 ? (item.spent / maxValue) * barMaxHeight : 0;

          return (
            <View key={item.day} style={{ alignItems: 'center', flex: 1 }}>
              {/* Dual bars container */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
                {/* Earned bar (green) */}
                <View
                  style={{
                    width: barWidth,
                    height: Math.max(earnedHeight, 4),
                    borderRadius: 5,
                    backgroundColor: '#10b981',
                    opacity: item.isToday ? 1 : 0.6,
                  }}
                />
                {/* Spent bar (accent) */}
                <View
                  style={{
                    width: barWidth,
                    height: Math.max(spentHeight, 4),
                    borderRadius: 5,
                    backgroundColor: accentColor,
                    opacity: item.isToday ? 1 : 0.6,
                  }}
                />
              </View>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 9,
                  fontWeight: item.isToday ? '700' : '500',
                  color: item.isToday ? (isDark ? '#ffffff' : '#111827') : (isDark ? '#6b7280' : '#9ca3af'),
                }}
              >
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Glass Mini Card Component
const GlassMiniCard = ({
  children,
  isDark,
  glowColor,
}: {
  children: React.ReactNode;
  isDark: boolean;
  glowColor?: string;
}) => (
  <View
    style={{
      flex: 1,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
    }}
  >
    <BlurView
      intensity={isDark ? 20 : 35}
      tint={isDark ? 'dark' : 'light'}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    />
    <LinearGradient
      colors={
        isDark
          ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)']
          : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    />
    {/* Top shine */}
    <LinearGradient
      colors={isDark ? ['rgba(255, 255, 255, 0.08)', 'transparent'] : ['rgba(255, 255, 255, 0.5)', 'transparent']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.6 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%',
      }}
    />
    {/* Optional glow */}
    {glowColor && (
      <LinearGradient
        colors={[`${glowColor}15`, 'transparent']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    )}
    <View style={{ padding: 12, alignItems: 'center' }}>{children}</View>
  </View>
);

// Circular Progress Component with gradient ring
const CircularProgress = ({
  progress,
  size,
  strokeWidth,
  isDark,
  accentColor,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  isDark: boolean;
  accentColor: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={accentColor} />
            <Stop offset="50%" stopColor="#8b5cf6" />
            <Stop offset="100%" stopColor="#10b981" />
          </SvgLinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
    </View>
  );
};

export const TodaysProgress: React.FC<TodaysProgressProps> = ({ isDark }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { wallet, nativeSpentToday, nativeEarnedToday, getWeeklyDailyStats } = useEarnedTime();
  const { accentColor } = useTheme();
  const [dailyGoal, setDailyGoal] = useState(60); // Default 1 hour

  // Load daily goal from storage
  useEffect(() => {
    const loadGoal = async () => {
      try {
        const storedGoal = await AsyncStorage.getItem('@default_app_limit_minutes');
        if (storedGoal) {
          setDailyGoal(parseInt(storedGoal, 10));
        }
      } catch (error) {
        console.error('Error loading daily goal:', error);
      }
    };
    loadGoal();
  }, []);

  // Use native values directly for real-time updates
  const todayEarned = nativeEarnedToday;
  const todaySpent = nativeSpentToday;

  // Get real weekly data from context (includes isToday flag)
  const weeklyData = useMemo(() => {
    return getWeeklyDailyStats(t);
  }, [getWeeklyDailyStats, t]);

  // Format minutes to readable string - show decimal if fractional part exists
  const formatMinutes = (minutes: number): string => {
    const hUnit = t("common.timeUnits.h");
    const mUnit = t("common.timeUnits.m");
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const minsDisplay = mins % 1 === 0 ? mins.toFixed(0) : mins.toFixed(1);
      return mins > 0 ? `${hours}${hUnit} ${minsDisplay}${mUnit}` : `${hours}${hUnit}`;
    }
    // Show decimal only if there's a fractional part
    const display = minutes % 1 === 0 ? minutes.toFixed(0) : minutes.toFixed(1);
    return `${display}${mUnit}`;
  };

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      {/* Main Card with Gradient Border Effect */}
      <View
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Gradient border - subtle */}
        <LinearGradient
          colors={[`${accentColor.primary}25`, '#8b5cf625', '#10b98125']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Inner card content with blur */}
        <View
          style={{
            margin: 1.5,
            borderRadius: 23,
            overflow: 'hidden',
          }}
        >
          <BlurView
            intensity={isDark ? 25 : 40}
            tint={isDark ? 'dark' : 'light'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)']
                : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Top shine for depth */}
          <LinearGradient
            colors={isDark ? ['rgba(255, 255, 255, 0.08)', 'transparent'] : ['rgba(255, 255, 255, 0.5)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
            }}
          />
          <View style={{ padding: 20 }}>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginRight: 10,
                }}
              >
                <LinearGradient
                  colors={[accentColor.primary, '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <Target size={18} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: isDark ? '#ffffff' : '#111827',
                  }}
                >
                  {t("progress.todaysProgress")}
                </Text>
                {/* <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? '#6b7280' : '#9ca3af',
                    marginTop: 1,
                  }}
                >
                  {t("progress.goal")}: {formatMinutes(dailyGoal)}
                </Text> */}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/lockin')}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? `${accentColor.primary}20` : `${accentColor.primary}15`,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <TrendingUp size={14} color={accentColor.primary} strokeWidth={2.5} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: accentColor.primary, marginLeft: 4 }}>{t("progress.earn")}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row - 3 glassy cards */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {/* Spent */}
            <GlassMiniCard isDark={isDark} glowColor={accentColor.primary}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {t("progress.spent")}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Clock size={14} color={accentColor.primary} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: accentColor.primary }}>
                  {formatMinutes(todaySpent)}
                </Text>
              </View>
            </GlassMiniCard>

            {/* Earned */}
            <GlassMiniCard isDark={isDark} glowColor="#10b981">
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {t("progress.earned")}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Dumbbell size={14} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>
                  {formatMinutes(todayEarned)}
                </Text>
              </View>
            </GlassMiniCard>

            {/* Balance */}
            <GlassMiniCard isDark={isDark} glowColor="#8b5cf6">
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {t("progress.balance")}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Wallet size={14} color="#8b5cf6" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8b5cf6' }}>
                  {formatMinutes(wallet.availableMinutes)}
                </Text>
              </View>
            </GlassMiniCard>
          </View>

          {/* Weekly Chart */}
          <View
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
            }}
          >
            <BlurView
              intensity={isDark ? 20 : 35}
              tint={isDark ? 'dark' : 'light'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)']
                  : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            {/* Top shine */}
            <LinearGradient
              colors={isDark ? ['rgba(255, 255, 255, 0.06)', 'transparent'] : ['rgba(255, 255, 255, 0.4)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
              }}
            />
            <View style={{ padding: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#ffffff' : '#111827', marginBottom: 4 }}>
                {t("progress.thisWeek")}
              </Text>
              <WeeklyChart data={weeklyData} isDark={isDark} accentColor={accentColor.primary} t={t} />
            </View>
          </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TodaysProgress;
