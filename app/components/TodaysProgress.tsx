import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, Dumbbell, ChevronRight, Target, TrendingUp, Wallet } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
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
}: {
  data: { day: string; earned: number; spent: number }[];
  isDark: boolean;
  accentColor: string;
}) => {
  const maxMinutes = Math.max(...data.map(d => Math.max(d.earned, d.spent)), 60);
  const chartHeight = 70;
  const barWidth = 10;

  return (
    <View style={{ marginTop: 16 }}>
      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#10b981' }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>Earned</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: accentColor }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>Spent</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: chartHeight }}>
        {data.map((item, index) => {
          const earnedHeight = maxMinutes > 0 ? (item.earned / maxMinutes) * (chartHeight - 16) : 4;
          const spentHeight = maxMinutes > 0 ? (item.spent / maxMinutes) * (chartHeight - 16) : 4;
          const isToday = index === data.length - 1;

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
                    opacity: isToday ? 1 : 0.6,
                  }}
                />
                {/* Spent bar (accent) */}
                <View
                  style={{
                    width: barWidth,
                    height: Math.max(spentHeight, 4),
                    borderRadius: 5,
                    backgroundColor: accentColor,
                    opacity: isToday ? 1 : 0.6,
                  }}
                />
              </View>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 9,
                  fontWeight: isToday ? '700' : '500',
                  color: isToday ? (isDark ? '#ffffff' : '#111827') : (isDark ? '#6b7280' : '#9ca3af'),
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
  const router = useRouter();
  const { wallet, getTodayEarned, getTodaySpent } = useEarnedTime();
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

  const todayEarned = getTodayEarned();
  const todaySpent = getTodaySpent();

  // Calculate progress (spent vs goal - shows how much of daily limit is used)
  const progressPercent = dailyGoal > 0 ? (todaySpent / dailyGoal) * 100 : 0;

  // Generate weekly data for the dual-candle chart (earned + spent per day)
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    return days.map((day, index) => {
      // For today, use actual values
      if (index === mondayOffset) {
        return { day, earned: todayEarned, spent: todaySpent };
      }
      // For past days - in production, load from historical storage
      if (index < mondayOffset) {
        // Seed based on day for consistent values
        const seed = index + today.getDate();
        const earnedSim = Math.round((10 + (seed % 20)) * 10) / 10;
        const spentSim = Math.round((20 + ((seed * 3) % 40)) * 10) / 10;
        return { day, earned: earnedSim, spent: spentSim };
      }
      // Future days
      return { day, earned: 0, spent: 0 };
    });
  }, [todayEarned, todaySpent]);

  // Format minutes to readable string
  const formatMinutes = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${Math.round(minutes)}m`;
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

        {/* Inner card content - transparent bg */}
        <View
          style={{
            margin: 1.5,
            borderRadius: 23,
            backgroundColor: 'transparent',
            padding: 20,
          }}
        >

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
                  Today's Progress
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? '#6b7280' : '#9ca3af',
                    marginTop: 1,
                  }}
                >
                  Goal: {formatMinutes(dailyGoal)}
                </Text>
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
              <Text style={{ fontSize: 12, fontWeight: '700', color: accentColor.primary, marginLeft: 4 }}>Earn</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row - 3 glassy cards */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {/* Spent */}
            <View
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isDark ? '#6b7280' : '#9ca3af',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                SPENT
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Clock size={14} color={accentColor.primary} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: accentColor.primary }}>
                  {formatMinutes(todaySpent)}
                </Text>
              </View>
            </View>

            {/* Earned */}
            <View
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isDark ? '#6b7280' : '#9ca3af',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                EARNED
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Dumbbell size={14} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>
                  {formatMinutes(todayEarned)}
                </Text>
              </View>
            </View>

            {/* Balance */}
            <View
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isDark ? '#6b7280' : '#9ca3af',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                BALANCE
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Wallet size={14} color="#8b5cf6" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8b5cf6' }}>
                  {formatMinutes(wallet.availableMinutes)}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>
                Daily Progress
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: accentColor.primary }}>
                {Math.min(Math.round(progressPercent), 100)}%
              </Text>
            </View>
            <View
              style={{
                height: 8,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={[accentColor.primary, '#8b5cf6', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: '100%',
                  width: `${Math.min(progressPercent, 100)}%`,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>

          {/* Weekly Chart */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#ffffff' : '#111827', marginBottom: 4 }}>
              This Week
            </Text>
            <WeeklyChart data={weeklyData} isDark={isDark} accentColor={accentColor.primary} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default TodaysProgress;
