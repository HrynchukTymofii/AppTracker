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
  pickups: number;
  hasRealData?: boolean;
}

export interface DailyUsageData {
  date: string;
  dayOfMonth: number;
  dayOfWeek: number;
  hours: number;
  pickups: number;
}

export interface WeekComparisonData {
  thisWeek: {
    totalHours: number;
    avgHours: number;
    pickups: number;
    dailyData: { day: string; hours: number }[];
  };
  lastWeek: {
    totalHours: number;
    avgHours: number;
    pickups: number;
    dailyData: { day: string; hours: number }[];
  };
  comparison: {
    hoursDiff: number;
    hoursPercentChange: number;
    pickupsDiff: number;
    pickupsPercentChange: number;
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
        pickups: 0,
        lastReset: Date.now(),
      }));
    }
  } catch (error) {
    console.error('Error initializing tracking:', error);
  }
};

/**
 * Log a phone pickup/unlock event
 */
export const logPickup = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      data.pickups = (data.pickups || 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error logging pickup:', error);
  }
};

/**
 * Get today's pickup count
 */
export const getTodayPickups = async (): Promise<number> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const lastReset = data.lastReset || 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (lastReset < today.getTime()) {
        data.pickups = 0;
        data.lastReset = Date.now();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return 0;
      }

      return data.pickups || 0;
    }
  } catch (error) {
    console.error('Error getting pickups:', error);
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
          pickups: nativeData.pickups,
          hasRealData: true,
        };
      }
    } catch (error) {
      console.error('Error getting native usage stats:', error);
    }
  }

  // Fall back to simulated data
  const pickups = await getTodayPickups();
  return getSimulatedUsageData(pickups);
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
  // Try native module first
  if (NativeUsageStats && Platform.OS === 'android') {
    try {
      const nativeData = await NativeUsageStats.getWeekUsageStats(weekOffset);

      if (nativeData.hasPermission && nativeData.apps && nativeData.apps.length > 0) {
        // Filter apps for display (remove current app from list)
        const filteredApps = filterApps(nativeData.apps);

        // Keep original total screen time (includes current app usage)
        const totalScreenTime = nativeData.totalScreenTime ||
          nativeData.apps.reduce((sum: number, app: AppUsageData) => sum + app.timeInForeground, 0);

        // Only return if we actually have meaningful data
        if (totalScreenTime > 0 || filteredApps.length > 0) {
          return {
            apps: filteredApps,
            totalScreenTime,
            pickups: nativeData.pickups || 0,
            hasRealData: true,
          };
        }
      }
    } catch (error) {
      // Silently fall back to simulated data
    }
  }

  // Fall back to simulated data for this week offset
  return getSimulatedWeekUsageData(weekOffset);
};

/**
 * Get daily usage stats for the week
 */
export const getDailyUsageForWeek = async (weekOffset: number = 0): Promise<{ day: string; hours: number }[]> => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from 6 days ago + weekOffset
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6 + (weekOffset * 7));

  // Generate simulated data for fallback/filling gaps
  const seed = Math.abs(weekOffset * 7) + new Date().getMonth() + 10;
  const generateSimulatedHours = (index: number, date: Date): number => {
    const isFuture = date > new Date();
    return isFuture ? 0 : 2 + ((seed + index) % 5);
  };

  // Try native module first
  if (NativeUsageStats && Platform.OS === 'android') {
    try {
      const hasPermission = await NativeUsageStats.hasUsageStatsPermission();
      if (hasPermission) {
        const dailyData = await NativeUsageStats.getDailyUsageForWeek(weekOffset);

        if (dailyData && dailyData.length === 7) {
          // For current week (weekOffset >= 0), use native data as-is
          if (weekOffset >= 0) {
            return dailyData;
          }

          // For past weeks, fill in zeros with simulated data (Android may purge old events)
          return dailyData.map((d: any, index: number) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + index);

            // If native has 0 hours for a past day, use simulated
            if (d.hours === 0 && date <= new Date()) {
              return {
                day: d.day || dayNames[date.getDay()],
                hours: Math.round(generateSimulatedHours(index, date) * 10) / 10,
              };
            }
            return d;
          });
        }
      }
    } catch (error) {
      // Silently fall back to simulated data
    }
  }

  // Fall back to fully simulated data
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      day: dayNames[date.getDay()],
      hours: Math.round(generateSimulatedHours(index, date) * 10) / 10,
    };
  });
};

/**
 * Simulated data for today (used when native is unavailable)
 */
const getSimulatedUsageData = (pickups: number): UsageStatsData => {
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
    pickups: pickups > 0 ? pickups : 80 + (seed % 50),
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
    pickups: 600 + (seed % 200),
    hasRealData: false,
  };
};

/**
 * Format milliseconds to human readable duration
 */
export const formatDuration = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate health score based on usage
 * Lower usage = higher health score
 */
export const calculateHealthScore = (totalScreenTimeMs: number, pickups: number): number => {
  const targetScreenTime = 3 * 60 * 60 * 1000; // 3 hours in ms
  const targetPickups = 80;

  const screenTimeScore = Math.max(0, 100 - ((totalScreenTimeMs / targetScreenTime) * 50));
  const pickupsScore = Math.max(0, 100 - ((pickups / targetPickups) * 50));

  return Math.round((screenTimeScore + pickupsScore) / 2);
};

/**
 * Get orb level (1-5) based on health score
 */
export const getOrbLevel = (healthScore: number): number => {
  if (healthScore >= 90) return 5;
  if (healthScore >= 75) return 4;
  if (healthScore >= 60) return 3;
  if (healthScore >= 40) return 2;
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
          pickups: nativeData.pickups,
          hasRealData: true,
        };
      }
    } catch (error) {
      // Native function may not exist until rebuild - silently fall back
    }
  }

  const pickups = await getTodayPickups();
  return getSimulatedWeekUsageData(pickups * 30);
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

  // Fall back to simulated data
  const now = new Date();
  now.setMonth(now.getMonth() + monthOffset);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const seed = now.getMonth() + now.getFullYear();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
    const isFuture = date > new Date();
    const baseHours = isFuture ? 0 : 2 + ((seed + i) % 4);

    return {
      date: date.toISOString().split('T')[0],
      dayOfMonth: i + 1,
      dayOfWeek: date.getDay(),
      hours: Math.round(baseHours * 10) / 10,
      pickups: isFuture ? 0 : 50 + ((seed + i) % 50),
    };
  });
};

/**
 * Get week comparison data (this week vs last week)
 */
export const getWeekComparison = async (): Promise<WeekComparisonData> => {
  if (NativeUsageStats && Platform.OS === 'android' && typeof NativeUsageStats.getWeekComparison === 'function') {
    try {
      const hasPermission = await NativeUsageStats.hasUsageStatsPermission();
      if (hasPermission) {
        const comparison = await NativeUsageStats.getWeekComparison();
        if (comparison) {
          return comparison as WeekComparisonData;
        }
      }
    } catch (error) {
      // Native function may not exist until rebuild - silently fall back
    }
  }

  // Fall back to simulated data
  const seed = new Date().getDate();
  const thisWeekTotal = 20 + (seed % 15);
  const lastWeekTotal = 22 + ((seed + 7) % 15);
  const diff = thisWeekTotal - lastWeekTotal;

  return {
    thisWeek: {
      totalHours: thisWeekTotal,
      avgHours: Math.round((thisWeekTotal / 7) * 10) / 10,
      pickups: 400 + (seed % 200),
      dailyData: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
        day,
        hours: 2 + ((seed + i) % 4),
      })),
    },
    lastWeek: {
      totalHours: lastWeekTotal,
      avgHours: Math.round((lastWeekTotal / 7) * 10) / 10,
      pickups: 420 + ((seed + 7) % 200),
      dailyData: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
        day,
        hours: 2.5 + ((seed + i + 7) % 4),
      })),
    },
    comparison: {
      hoursDiff: Math.round(diff * 10) / 10,
      hoursPercentChange: Math.round((diff / lastWeekTotal) * 1000) / 10,
      pickupsDiff: -20 + (seed % 40),
      pickupsPercentChange: -5 + (seed % 10),
      improved: diff < 0,
    },
  };
};
