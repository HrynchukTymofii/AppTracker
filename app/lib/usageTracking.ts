/**
 * Usage Tracking Module
 *
 * Uses native modules for real usage data:
 * - Android: UsageStatsManager via native Kotlin module
 * - iOS: DeviceActivity/FamilyControls (requires Apple entitlements)
 *
 * Falls back to simulated data when native module is unavailable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getWeekUsage, getWeekDateRange } from './usageDatabase';

// Import native module (will be null if not available)
let NativeUsageStats: any = null;
try {
  NativeUsageStats = require('../modules/usage-stats').default;
} catch (e) {
  console.log('Native UsageStats module not available, using simulated data');
}

export interface AppUsageData {
  packageName: string;
  appName: string;
  timeInForeground: number; // milliseconds
  lastTimeUsed: number;
  iconUrl?: string;
}

export interface UsageStatsData {
  apps: AppUsageData[];
  totalScreenTime: number;
  unlocks: number;
  hasRealData?: boolean;
}

export interface DailyUsageData {
  date: string;
  dayOfMonth: number;
  dayOfWeek: number;
  hours: number;
  unlocks: number;
}

export interface WeekComparisonData {
  thisWeek: {
    totalHours: number;
    avgHours: number;
    unlocks: number;
    dailyData: { day: string; hours: number }[];
  };
  lastWeek: {
    totalHours: number;
    avgHours: number;
    unlocks: number;
    dailyData: { day: string; hours: number }[];
  };
  comparison: {
    hoursDiff: number;
    hoursPercentChange: number;
    unlocksDiff: number;
    unlocksPercentChange: number;
    improved: boolean;
  };
}

const STORAGE_KEY = '@usage_tracking';
const CACHE_KEY = '@usage_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if native module is available and has permission
 */
export const hasNativePermission = async (): Promise<boolean> => {
  if (!NativeUsageStats) return false;
  try {
    return await NativeUsageStats.hasUsageStatsPermission();
  } catch (e) {
    return false;
  }
};

/**
 * Open native settings to grant permission
 */
export const openPermissionSettings = (): void => {
  if (NativeUsageStats) {
    NativeUsageStats.openUsageStatsSettings();
  }
};

/**
 * Initialize tracking (call on app start)
 */
export const initializeTracking = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessions: [],
        unlocks: 0,
        lastReset: Date.now(),
      }));
    }
  } catch (error) {
    console.error('Error initializing tracking:', error);
  }
};

/**
 * Log a phone unlock event
 */
export const logUnlock = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      data.unlocks = (data.unlocks || 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error logging unlock:', error);
  }
};

/**
 * Get today's unlock count
 */
export const getTodayUnlocks = async (): Promise<number> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const lastReset = data.lastReset || 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (lastReset < today.getTime()) {
        data.unlocks = 0;
        data.lastReset = Date.now();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return 0;
      }

      return data.unlocks || 0;
    }
  } catch (error) {
    console.error('Error getting unlocks:', error);
  }
  return 0;
};

/**
 * Filter apps - remove current app and apps with < 1 minute usage
 */
const filterApps = (apps: AppUsageData[]): AppUsageData[] => {
  const ONE_MINUTE = 60 * 1000; // 1 minute in milliseconds

  return apps.filter(app => {
    // Filter out this app (LockIn/AppBlocker)
    if (app.packageName.includes('appblocker') ||
        app.packageName.includes('lockin') ||
        app.appName.toLowerCase().includes('lockin') ||
        app.appName.toLowerCase().includes('appblocker')) {
      return false;
    }

    // Filter out apps with less than 1 minute usage
    if (app.timeInForeground < ONE_MINUTE) {
      return false;
    }

    return true;
  });
};

/**
 * Get today's usage stats - tries native first, falls back to simulated
 */
export const getTodayUsageStats = async (): Promise<UsageStatsData> => {
  // Try native module first
  if (NativeUsageStats && Platform.OS === 'android') {
    try {
      const nativeData = await NativeUsageStats.getTodayUsageStats();

      if (nativeData.hasPermission && nativeData.apps.length > 0) {
        // Filter apps for display (remove current app from list)
        const filteredApps = filterApps(nativeData.apps);

        // Keep original total screen time (includes current app usage)
        // This ensures stats include all usage including this app
        const totalScreenTime = nativeData.totalScreenTime ||
          nativeData.apps.reduce((sum: number, app: AppUsageData) => sum + app.timeInForeground, 0);

        // Cache the real data
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: { ...nativeData, apps: filteredApps, totalScreenTime },
          timestamp: Date.now(),
          type: 'today',
        }));

        return {
          apps: filteredApps,
          totalScreenTime, // Includes current app usage
          unlocks: nativeData.unlocks,
          hasRealData: true,
        };
      }
    } catch (error) {
      console.error('Error getting native usage stats:', error);
    }
  }

  // Don't use simulated data - return empty
  console.log('[UsageTracking] getTodayUsageStats - No real data available, returning empty');
  return {
    apps: [],
    totalScreenTime: 0,
    unlocks: 0,
    hasRealData: false,
  };
};

/**
 * Get usage stats for the current week
 */
export const getWeekUsageStats = async (): Promise<UsageStatsData> => {
  return getWeekUsageStatsWithOffset(0);
};

/**
 * Get usage stats for a specific week offset
 */
export const getWeekUsageStatsWithOffset = async (weekOffset: number): Promise<UsageStatsData> => {
  const fnStart = Date.now();
  console.log('[UsageTracking] getWeekUsageStatsWithOffset START, weekOffset:', weekOffset);

  // Try native module first
  if (NativeUsageStats && Platform.OS === 'android') {
    try {
      console.log('[UsageTracking] Calling native getWeekUsageStats...');
      const nativeStart = Date.now();
      const nativeData = await NativeUsageStats.getWeekUsageStats(weekOffset);
      console.log('[UsageTracking] Native getWeekUsageStats done', `(${Date.now() - nativeStart}ms)`, { hasPermission: nativeData.hasPermission, appsCount: nativeData.apps?.length });

      if (nativeData.hasPermission && nativeData.apps && nativeData.apps.length > 0) {
        // Filter apps for display (remove current app from list)
        const filteredApps = filterApps(nativeData.apps);

        // Keep original total screen time (includes current app usage)
        const totalScreenTime = nativeData.totalScreenTime ||
          nativeData.apps.reduce((sum: number, app: AppUsageData) => sum + app.timeInForeground, 0);

        console.log('[UsageTracking] getWeekUsageStatsWithOffset SUCCESS (native)', `(${Date.now() - fnStart}ms total)`);
        return {
          apps: filteredApps,
          totalScreenTime,
          unlocks: nativeData.unlocks || 0,
          hasRealData: true,
        };
      }
    } catch (error) {
      console.log('[UsageTracking] Native getWeekUsageStats error:', error);
    }
  }

  // For past weeks, try to get data from the database
  if (weekOffset < 0) {
    try {
      const { startDate, endDate } = getWeekDateRange(weekOffset);
      const dbData = await getWeekUsage(startDate, endDate);

      if (dbData && dbData.length > 0) {
        // Sum up screen time and unlocks from database
        let totalScreenTime = 0;
        let totalUnlocks = 0;
        const appsMap = new Map<string, any>();

        dbData.forEach(row => {
          totalScreenTime += row.total_screen_time || 0;
          totalUnlocks += row.pickups || 0; // DB column is still named 'pickups'

          // Aggregate app data
          if (row.apps_data && Array.isArray(row.apps_data)) {
            row.apps_data.forEach((app: any) => {
              const existing = appsMap.get(app.packageName);
              if (existing) {
                existing.timeInForeground += app.timeInForeground || 0;
              } else {
                appsMap.set(app.packageName, { ...app });
              }
            });
          }
        });

        const apps = Array.from(appsMap.values())
          .sort((a, b) => b.timeInForeground - a.timeInForeground)
          .slice(0, 15);

        return {
          apps,
          totalScreenTime,
          unlocks: totalUnlocks,
          hasRealData: true,
        };
      }
    } catch (error) {
      console.error('Error fetching from database:', error);
    }

    // If database also has no data, return empty
    return {
      apps: [],
      totalScreenTime: 0,
      unlocks: 0,
      hasRealData: false,
    };
  }

  // Don't use simulated data - return empty data instead
  console.log('[UsageTracking] getWeekUsageStatsWithOffset - No real data available, returning empty');
  return {
    apps: [],
    totalScreenTime: 0,
    unlocks: 0,
    hasRealData: false,
  };
};

/**
 * Get daily usage stats for the week
 */
export const getDailyUsageForWeek = async (weekOffset: number = 0): Promise<{ day: string; hours: number }[]> => {
  const fnStart = Date.now();
  console.log('[UsageTracking] getDailyUsageForWeek START, weekOffset:', weekOffset);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from 6 days ago + weekOffset
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6 + (weekOffset * 7));

  // Try native module first
  if (NativeUsageStats && Platform.OS === 'android') {
    try {
      console.log('[UsageTracking] Checking hasUsageStatsPermission...');
      const permStart = Date.now();
      const hasPermission = await NativeUsageStats.hasUsageStatsPermission();
      console.log('[UsageTracking] hasUsageStatsPermission:', hasPermission, `(${Date.now() - permStart}ms)`);

      if (hasPermission) {
        console.log('[UsageTracking] Calling native getDailyUsageForWeek...');
        const nativeStart = Date.now();
        const dailyData = await NativeUsageStats.getDailyUsageForWeek(weekOffset);
        console.log('[UsageTracking] Native getDailyUsageForWeek done', `(${Date.now() - nativeStart}ms)`, { length: dailyData?.length });

        // Only use native data if it has actual content (not all zeros)
        if (dailyData && dailyData.length === 7) {
          const hasActualData = dailyData.some((d: any) => d.hours > 0);
          if (hasActualData) {
            console.log('[UsageTracking] getDailyUsageForWeek SUCCESS (native)', `(${Date.now() - fnStart}ms total)`);
            return dailyData;
          }
        }
      }
    } catch (error) {
      console.log('[UsageTracking] getDailyUsageForWeek native error:', error);
    }
  }

  // For past weeks (or when native returned zeros), try to get data from the database
  if (weekOffset <= 0) {
    try {
      const { startDate: dbStartDate, endDate: dbEndDate } = getWeekDateRange(weekOffset);
      const dbData = await getWeekUsage(dbStartDate, dbEndDate);

      if (dbData && dbData.length > 0) {
        // Create a map of date -> hours from database
        const dateHoursMap = new Map<string, number>();
        dbData.forEach(row => {
          const hours = row.total_screen_time / (1000 * 60 * 60); // Convert ms to hours
          dateHoursMap.set(row.date, hours);
        });

        // Generate 7 days of data
        return Array.from({ length: 7 }, (_, index) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + index);
          const dateStr = date.toISOString().split('T')[0];
          const hours = dateHoursMap.get(dateStr) || 0;
          return {
            day: dayNames[date.getDay()],
            hours: Math.round(hours * 10) / 10,
          };
        });
      }
    } catch (error) {
      console.error('Error fetching from database:', error);
    }

    // If database also has no data, return zeros
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        day: dayNames[date.getDay()],
        hours: 0,
      };
    });
  }

  // Don't use simulated data - return zeros instead
  console.log('[UsageTracking] getDailyUsageForWeek - No real data available, returning zeros');
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      day: dayNames[date.getDay()],
      hours: 0,
    };
  });
};

/**
 * Simulated data for today (used when native is unavailable)
 */
const getSimulatedUsageData = (unlocks: number): UsageStatsData => {
  // Use consistent data based on current date (not random each call)
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31;

  const apps: AppUsageData[] = [
    {
      packageName: 'com.instagram.android',
      appName: 'Instagram',
      timeInForeground: 7200000 + (seed % 3600000), // 2-3h
      lastTimeUsed: Date.now() - 1800000,
    },
    {
      packageName: 'com.google.android.youtube',
      appName: 'YouTube',
      timeInForeground: 5400000 + ((seed * 2) % 3600000), // 1.5-2.5h
      lastTimeUsed: Date.now() - 3600000,
    },
    {
      packageName: 'com.zhiliaoapp.musically',
      appName: 'TikTok',
      timeInForeground: 3600000 + ((seed * 3) % 3600000), // 1-2h
      lastTimeUsed: Date.now() - 7200000,
    },
    {
      packageName: 'com.twitter.android',
      appName: 'Twitter',
      timeInForeground: 1800000 + ((seed * 4) % 1800000), // 30m-1h
      lastTimeUsed: Date.now() - 10800000,
    },
    {
      packageName: 'com.facebook.katana',
      appName: 'Facebook',
      timeInForeground: 1800000 + ((seed * 5) % 900000), // 30m-45m
      lastTimeUsed: Date.now() - 14400000,
    },
    {
      packageName: 'com.whatsapp',
      appName: 'WhatsApp',
      timeInForeground: 900000 + ((seed * 6) % 1800000), // 15m-45m
      lastTimeUsed: Date.now() - 600000,
    },
    {
      packageName: 'com.snapchat.android',
      appName: 'Snapchat',
      timeInForeground: 1200000 + ((seed * 7) % 1200000), // 20m-40m
      lastTimeUsed: Date.now() - 5400000,
    },
  ];

  // Filter and sort apps
  const filteredApps = filterApps(apps);
  filteredApps.sort((a, b) => b.timeInForeground - a.timeInForeground);

  const totalScreenTime = filteredApps.reduce((sum, app) => sum + app.timeInForeground, 0);

  return {
    apps: filteredApps.slice(0, 7),
    totalScreenTime,
    unlocks: unlocks > 0 ? unlocks : 80 + (seed % 50),
    hasRealData: false,
  };
};

/**
 * Simulated data for the week
 */
const getSimulatedWeekUsageData = (weekOffset: number = 0): UsageStatsData => {
  // Use weekOffset to generate varied but consistent data for each week
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31 + Math.abs(weekOffset) * 17;

  const apps: AppUsageData[] = [
    {
      packageName: 'com.instagram.android',
      appName: 'Instagram',
      timeInForeground: 28800000 + (seed % 7200000), // 8-10h
      lastTimeUsed: Date.now() - 1800000,
    },
    {
      packageName: 'com.google.android.youtube',
      appName: 'YouTube',
      timeInForeground: 21600000 + ((seed * 2) % 7200000), // 6-8h
      lastTimeUsed: Date.now() - 3600000,
    },
    {
      packageName: 'com.zhiliaoapp.musically',
      appName: 'TikTok',
      timeInForeground: 14400000 + ((seed * 3) % 7200000), // 4-6h
      lastTimeUsed: Date.now() - 7200000,
    },
    {
      packageName: 'com.twitter.android',
      appName: 'Twitter',
      timeInForeground: 10800000 + ((seed * 4) % 3600000), // 3-4h
      lastTimeUsed: Date.now() - 10800000,
    },
    {
      packageName: 'com.facebook.katana',
      appName: 'Facebook',
      timeInForeground: 7200000 + ((seed * 5) % 3600000), // 2-3h
      lastTimeUsed: Date.now() - 14400000,
    },
  ];

  // Filter and sort apps
  const filteredApps = filterApps(apps);
  filteredApps.sort((a, b) => b.timeInForeground - a.timeInForeground);

  const totalScreenTime = filteredApps.reduce((sum, app) => sum + app.timeInForeground, 0);

  return {
    apps: filteredApps,
    totalScreenTime,
    unlocks: 600 + (seed % 200),
    hasRealData: false,
  };
};

/**
 * Format milliseconds to human readable duration
 */
export const formatDuration = (milliseconds: number, t?: (key: string) => string): string => {
  const hUnit = t ? t("common.timeUnits.h") : "h";
  const mUnit = t ? t("common.timeUnits.m") : "m";
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}${hUnit} ${minutes}${mUnit}`;
  }
  return `${minutes}${mUnit}`;
};

/**
 * Calculate health score based on usage and earned time
 * Formula: base + (earned * 0.3) - (spent * 0.3) - (unlocks * 0.2)
 * Returns: { displayScore: 0-100 capped, rawScore: actual value which can exceed 100 }
 */
export const calculateHealthScore = (
  totalScreenTimeMs: number,
  unlocks: number,
  earnedMinutes: number = 0,
  dailyGoalMinutes: number = 180 // Default 3 hours
): number => {
  // Start at 100, decrease based on usage
  const baseScore = 100;
  const screenTimeMinutes = totalScreenTimeMs / 1000 / 60;

  // Screen time penalty: deduct proportionally to daily goal
  // At 100% of goal = -40 points, at 200% = -80 points
  const screenTimePenalty = (screenTimeMinutes / dailyGoalMinutes) * 40;

  // Unlocks penalty: small deduction (max -15 at 150 unlocks)
  const unlocksPenalty = Math.min((unlocks / 150) * 15, 15);

  // Earned time bonus: reward exercise (0.5 per min, max +20)
  const earnedBonus = Math.min(earnedMinutes * 0.5, 20);

  // Calculate score
  const rawScore = baseScore - screenTimePenalty - unlocksPenalty + earnedBonus;

  // Return score capped between 0 and 100
  return Math.round(Math.max(0, Math.min(100, rawScore)));
};

/**
 * Calculate raw health score (without 0-100 cap for internal tracking)
 */
export const calculateRawHealthScore = (
  totalScreenTimeMs: number,
  unlocks: number,
  earnedMinutes: number = 0,
  dailyGoalMinutes: number = 180
): number => {
  const baseScore = 100;
  const screenTimeMinutes = totalScreenTimeMs / 1000 / 60;

  const screenTimePenalty = (screenTimeMinutes / dailyGoalMinutes) * 40;
  const unlocksPenalty = Math.min((unlocks / 150) * 15, 15);
  const earnedBonus = Math.min(earnedMinutes * 0.5, 20);

  return Math.round(Math.max(0, baseScore - screenTimePenalty - unlocksPenalty + earnedBonus));
};

/**
 * Get orb level (1-5) based on health score
 */
export const getOrbLevel = (healthScore: number): number => {
  if (healthScore >= 80) return 5;
  if (healthScore >= 60) return 4;
  if (healthScore >= 40) return 3;
  if (healthScore >= 20) return 2;
  return 1;
};

/**
 * Check if we're using real data or simulated
 */
export const isUsingRealData = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  return hasNativePermission();
};

/**
 * Get usage stats for a specific month
 */
export const getMonthUsageStats = async (monthOffset: number = 0): Promise<UsageStatsData> => {
  if (NativeUsageStats && Platform.OS === 'android' && typeof NativeUsageStats.getMonthUsageStats === 'function') {
    try {
      const nativeData = await NativeUsageStats.getMonthUsageStats(monthOffset);

      if (nativeData.hasPermission && nativeData.apps.length > 0) {
        const filteredApps = filterApps(nativeData.apps);
        const totalScreenTime = nativeData.totalScreenTime ||
          nativeData.apps.reduce((sum: number, app: AppUsageData) => sum + app.timeInForeground, 0);

        return {
          apps: filteredApps,
          totalScreenTime,
          unlocks: nativeData.unlocks,
          hasRealData: true,
        };
      }
    } catch (error) {
      // Native function may not exist until rebuild - silently fall back
    }
  }

  // Don't use simulated data - return empty
  console.log('[UsageTracking] getMonthUsageStats - No real data available, returning empty');
  return {
    apps: [],
    totalScreenTime: 0,
    unlocks: 0,
    hasRealData: false,
  };
};

/**
 * Get daily usage data for entire month
 */
export const getDailyUsageForMonth = async (monthOffset: number = 0): Promise<DailyUsageData[]> => {
  if (NativeUsageStats && Platform.OS === 'android') {
    try {
      const hasPermission = await NativeUsageStats.hasUsageStatsPermission();
      if (hasPermission && typeof NativeUsageStats.getDailyUsageForMonth === 'function') {
        const dailyData = await NativeUsageStats.getDailyUsageForMonth(monthOffset);
        if (dailyData && dailyData.length > 0) {
          return dailyData;
        }
      }
    } catch (error) {
      // Native function may not exist until rebuild - silently fall back
    }
  }

  // Don't use simulated data - return empty array
  console.log('[UsageTracking] getDailyUsageForMonth - No real data available, returning empty');
  return [];
};

/**
 * Get week comparison data (this week vs last week)
 * Calculates comparison using getDailyUsageForWeek and getWeekUsageStatsWithOffset
 */
export const getWeekComparison = async (): Promise<WeekComparisonData> => {
  try {
    // Get this week's data
    const thisWeekDaily = await getDailyUsageForWeek(0);
    const thisWeekStats = await getWeekUsageStatsWithOffset(0);

    // Get last week's data
    const lastWeekDaily = await getDailyUsageForWeek(-1);
    const lastWeekStats = await getWeekUsageStatsWithOffset(-1);

    // Calculate totals
    const thisWeekTotalHours = thisWeekDaily.reduce((sum, d) => sum + d.hours, 0);
    const lastWeekTotalHours = lastWeekDaily.reduce((sum, d) => sum + d.hours, 0);

    const thisWeekDaysWithData = thisWeekDaily.filter(d => d.hours > 0).length || 1;
    const lastWeekDaysWithData = lastWeekDaily.filter(d => d.hours > 0).length || 1;

    const thisWeekAvgHours = thisWeekTotalHours / thisWeekDaysWithData;
    const lastWeekAvgHours = lastWeekTotalHours / lastWeekDaysWithData;

    const thisWeekUnlocks = thisWeekStats.unlocks || 0;
    const lastWeekUnlocks = lastWeekStats.unlocks || 0;

    // Calculate differences
    const hoursDiff = thisWeekTotalHours - lastWeekTotalHours;
    const hoursPercentChange = lastWeekTotalHours > 0
      ? Math.round((hoursDiff / lastWeekTotalHours) * 100)
      : 0;

    const unlocksDiff = thisWeekUnlocks - lastWeekUnlocks;
    const unlocksPercentChange = lastWeekUnlocks > 0
      ? Math.round((unlocksDiff / lastWeekUnlocks) * 100)
      : 0;

    // Improved = less screen time this week
    const improved = hoursDiff < 0;

    return {
      thisWeek: {
        totalHours: Math.round(thisWeekTotalHours * 10) / 10,
        avgHours: Math.round(thisWeekAvgHours * 10) / 10,
        unlocks: thisWeekUnlocks,
        dailyData: thisWeekDaily,
      },
      lastWeek: {
        totalHours: Math.round(lastWeekTotalHours * 10) / 10,
        avgHours: Math.round(lastWeekAvgHours * 10) / 10,
        unlocks: lastWeekUnlocks,
        dailyData: lastWeekDaily,
      },
      comparison: {
        hoursDiff: Math.round(hoursDiff * 10) / 10,
        hoursPercentChange,
        unlocksDiff,
        unlocksPercentChange,
        improved,
      },
    };
  } catch (error) {
    console.error('Error calculating week comparison:', error);

    // Return empty comparison data on error
    const emptyDailyData = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => ({
      day,
      hours: 0,
    }));

    return {
      thisWeek: {
        totalHours: 0,
        avgHours: 0,
        unlocks: 0,
        dailyData: emptyDailyData,
      },
      lastWeek: {
        totalHours: 0,
        avgHours: 0,
        unlocks: 0,
        dailyData: emptyDailyData,
      },
      comparison: {
        hoursDiff: 0,
        hoursPercentChange: 0,
        unlocksDiff: 0,
        unlocksPercentChange: 0,
        improved: false,
      },
    };
  }
};
