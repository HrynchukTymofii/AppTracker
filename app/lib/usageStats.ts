import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

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
}

/**
 * Request PACKAGE_USAGE_STATS permission on Android
 */
export const requestUsageStatsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    // This permission requires going to Settings
    // We need to guide the user to enable it manually
    const { UsageStats } = NativeModules;
    if (UsageStats) {
      return await UsageStats.requestUsageStatsPermission();
    }
    return false;
  } catch (error) {
    console.error('Error requesting usage stats permission:', error);
    return false;
  }
};

/**
 * Check if PACKAGE_USAGE_STATS permission is granted
 */
export const hasUsageStatsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const { UsageStats } = NativeModules;
    if (UsageStats) {
      return await UsageStats.hasUsageStatsPermission();
    }
    return false;
  } catch (error) {
    console.error('Error checking usage stats permission:', error);
    return false;
  }
};

/**
 * Get app usage stats for a time range
 */
export const getUsageStats = async (
  startTime: number,
  endTime: number
): Promise<UsageStatsData> => {
  if (Platform.OS !== 'android') {
    // Return mock data for iOS/development
    return getMockUsageData();
  }

  try {
    const { UsageStats } = NativeModules;
    if (UsageStats) {
      const data = await UsageStats.queryUsageStats(startTime, endTime);
      return processUsageData(data);
    }
    return getMockUsageData();
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return getMockUsageData();
  }
};

/**
 * Get usage stats for today
 */
export const getTodayUsageStats = async (): Promise<UsageStatsData> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const now = new Date();

  return getUsageStats(startOfDay.getTime(), now.getTime());
};

/**
 * Get usage stats for the current week
 */
export const getWeekUsageStats = async (): Promise<UsageStatsData> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const now = new Date();

  return getUsageStats(startOfWeek.getTime(), now.getTime());
};

/**
 * Get usage stats for a specific week offset (0 = current week, -1 = last week, etc.)
 */
export const getWeekUsageStatsWithOffset = async (weekOffset: number): Promise<UsageStatsData> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return getUsageStats(startOfWeek.getTime(), endOfWeek.getTime());
};

/**
 * Get daily usage stats for the week
 */
export const getDailyUsageForWeek = async (weekOffset: number = 0): Promise<{ day: string; hours: number }[]> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyUsage = [];

  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(startOfWeek);
    dayStart.setDate(startOfWeek.getDate() + i);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const data = await getUsageStats(dayStart.getTime(), dayEnd.getTime());
    dailyUsage.push({
      day: dayNames[i],
      hours: Math.round((data.totalScreenTime / (1000 * 60 * 60)) * 10) / 10,
    });
  }

  return dailyUsage;
};

/**
 * Process raw usage data
 */
const processUsageData = (rawData: any): UsageStatsData => {
  // Process and sort apps by usage time
  const apps: AppUsageData[] = rawData.apps || [];
  const sortedApps = apps.sort((a, b) => b.timeInForeground - a.timeInForeground);

  const totalScreenTime = sortedApps.reduce((sum, app) => sum + app.timeInForeground, 0);

  return {
    apps: sortedApps,
    totalScreenTime,
    pickups: rawData.pickups || 0,
  };
};

/**
 * Get mock usage data for development/iOS
 */
const getMockUsageData = (): UsageStatsData => {
  return {
    apps: [
      {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        timeInForeground: 30840000, // 8h 34m in milliseconds
        lastTimeUsed: Date.now() - 3600000,
      },
      {
        packageName: 'com.google.android.youtube',
        appName: 'YouTube',
        timeInForeground: 24300000, // 6h 45m
        lastTimeUsed: Date.now() - 7200000,
      },
      {
        packageName: 'com.zhiliaoapp.musically',
        appName: 'TikTok',
        timeInForeground: 15120000, // 4h 12m
        lastTimeUsed: Date.now() - 10800000,
      },
      {
        packageName: 'com.twitter.android',
        appName: 'Twitter',
        timeInForeground: 12000000, // 3h 20m
        lastTimeUsed: Date.now() - 14400000,
      },
      {
        packageName: 'com.facebook.katana',
        appName: 'Facebook',
        timeInForeground: 6240000, // 1h 44m
        lastTimeUsed: Date.now() - 18000000,
      },
    ],
    totalScreenTime: 88500000, // Total in milliseconds
    pickups: 142,
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
  // Target: < 2 hours screen time, < 50 pickups per day
  const targetScreenTime = 2 * 60 * 60 * 1000; // 2 hours in ms
  const targetPickups = 50;

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
