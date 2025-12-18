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
 * Get today's usage stats - tries native first, falls back to simulated
 */
export const getTodayUsageStats = async (): Promise<UsageStatsData> => {
  // Try native module first
  if (NativeUsageStats && Platform.OS === 'android') {
    try {
      const nativeData = await NativeUsageStats.getTodayUsageStats();

      if (nativeData.hasPermission && nativeData.apps.length > 0) {
        // Cache the real data
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: nativeData,
          timestamp: Date.now(),
          type: 'today',
        }));

        return {
          apps: nativeData.apps,
          totalScreenTime: nativeData.totalScreenTime,
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

      if (nativeData.hasPermission && nativeData.apps.length > 0) {
        return {
          apps: nativeData.apps,
          totalScreenTime: nativeData.totalScreenTime,
          pickups: nativeData.pickups,
          hasRealData: true,
        };
      }
    } catch (error) {
      console.error('Error getting native week stats:', error);
    }
  }

  // Fall back to simulated data
  const pickups = await getTodayPickups();
  return getSimulatedWeekUsageData(pickups * 7);
};

/**
 * Get daily usage stats for the week
 */
export const getDailyUsageForWeek = async (weekOffset: number = 0): Promise<{ day: string; hours: number }[]> => {
  // Try native module first
  if (NativeUsageStats && Platform.OS === 'android') {
    try {
      const hasPermission = await NativeUsageStats.hasUsageStatsPermission();
      if (hasPermission) {
        const dailyData = await NativeUsageStats.getDailyUsageForWeek(weekOffset);
        if (dailyData && dailyData.length > 0) {
          return dailyData;
        }
      }
    } catch (error) {
      console.error('Error getting native daily stats:', error);
    }
  }

  // Fall back to simulated data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate consistent patterns based on week offset (not random)
  const seed = weekOffset * 7 + new Date().getMonth();
  return dayNames.map((day, index) => {
    const baseHours = 2 + ((seed + index) % 4);
    return {
      day,
      hours: Math.round(baseHours * 10) / 10,
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

  apps.sort((a, b) => b.timeInForeground - a.timeInForeground);
  const totalScreenTime = apps.reduce((sum, app) => sum + app.timeInForeground, 0);

  return {
    apps: apps.slice(0, 7),
    totalScreenTime,
    pickups: pickups > 0 ? pickups : 80 + (seed % 50),
    hasRealData: false,
  };
};

/**
 * Simulated data for the week
 */
const getSimulatedWeekUsageData = (weeklyPickups: number): UsageStatsData => {
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31;

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

  apps.sort((a, b) => b.timeInForeground - a.timeInForeground);
  const totalScreenTime = apps.reduce((sum, app) => sum + app.timeInForeground, 0);

  return {
    apps,
    totalScreenTime,
    pickups: weeklyPickups > 0 ? weeklyPickups : 600 + (seed % 200),
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
