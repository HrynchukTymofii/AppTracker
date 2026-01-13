import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as AppBlocker from '@/modules/app-blocker';
import { ExerciseType } from '@/lib/poseUtils';

// Types
export interface EarnedTimeWallet {
  totalEarned: number;       // Total minutes ever earned (for stats)
  availableMinutes: number;  // Current spendable balance
  lastUpdated: number;
}

// Streak tracking - counts days where user earned ANY time (exercises or photo tasks)
export interface StreakData {
  currentStreak: number;      // Current consecutive days with earnings
  longestStreak: number;      // All-time longest streak
  lastEarningDate: string;    // YYYY-MM-DD of last earning
  streakShownToday: boolean;  // Whether streak modal was shown today
}

export interface EarningRecord {
  id: string;
  type: ExerciseType | 'photo_task' | 'custom';
  minutesEarned: number;
  details: string;           // e.g., "10 pushups" or "30s plank"
  timestamp: number;
}

export interface SpendingRecord {
  id: string;
  packageName: string;
  appName: string;
  minutesSpent: number;
  wasScheduleFree: boolean;  // true if during free schedule
  timestamp: number;
}

export interface DailyUsage {
  date: string;              // YYYY-MM-DD
  appUsage: Record<string, number>;  // packageName -> minutes used today
}

interface EarnedTimeContextType {
  // Wallet state
  wallet: EarnedTimeWallet;
  earningHistory: EarningRecord[];
  spendingHistory: SpendingRecord[];
  todayUsage: DailyUsage;

  // Native values (Android - updated every 5s)
  nativeSpentToday: number;
  nativeEarnedToday: number;

  // Total daily limit
  totalDailyLimit: number;
  setTotalDailyLimit: (minutes: number) => Promise<void>;

  // Earning actions
  earnTime: (
    type: EarningRecord['type'],
    minutes: number,
    details: string
  ) => Promise<void>;

  // Spending actions
  spendTime: (
    packageName: string,
    appName: string,
    minutes: number
  ) => Promise<boolean>;  // Returns false if insufficient balance

  // Urgent spending (allows going negative)
  urgentSpend: (
    packageName: string,
    appName: string,
    minutes: number
  ) => Promise<void>;

  // Check if can use app
  canUseApp: (packageName: string, dailyLimitMinutes: number) => {
    canUse: boolean;
    reason: 'ok' | 'no_balance' | 'limit_reached' | 'total_limit_reached';
    remainingLimit: number;
    availableMinutes: number;
    totalRemainingLimit: number;
  };

  // Record free usage (during schedule)
  recordFreeUsage: (
    packageName: string,
    appName: string,
    minutes: number
  ) => Promise<void>;

  // Get remaining limit for an app today
  getRemainingLimit: (packageName: string, dailyLimitMinutes: number) => number;

  // Get total usage today (all apps combined)
  getTotalUsageToday: () => number;
  getTotalRemainingLimit: () => number;

  // Stats
  getTodayEarned: () => number;
  getTodaySpent: () => number;
  getWeekStats: () => { earned: number; spent: number };
  getDayStats: (date: Date) => { earned: number; spent: number };
  getWeeklyDailyStats: (t?: (key: string) => string) => { day: string; earned: number; spent: number; isToday: boolean }[];

  // Sync real usage with wallet
  syncUsageWithWallet: (realUsageMap: Record<string, number>) => Promise<number>;

  // Sync website usage with wallet
  syncWebsiteUsageWithWallet: (websiteUsageMap: Record<string, number>) => Promise<number>;

  // Sync native app usage (from AccessibilityService session tracking) with wallet
  syncNativeAppUsageWithWallet: () => Promise<number>;

  // Reset wallet to a specific amount (for fixing issues)
  resetWallet: (minutes: number) => Promise<void>;

  // Refresh data
  refreshData: () => Promise<void>;

  // Streak tracking
  streak: StreakData;
  isFirstEarningToday: () => boolean;
  markStreakShown: () => Promise<void>;
  recordActivity: () => Promise<boolean>; // Returns true if it was the first activity of the day
}

const EarnedTimeContext = createContext<EarnedTimeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WALLET: '@earned_time_wallet',
  EARNING_HISTORY: '@earned_time_earning_history',
  SPENDING_HISTORY: '@earned_time_spending_history',
  DAILY_USAGE: '@earned_time_daily_usage',
  LAST_SYNCED_USAGE: '@earned_time_last_synced_usage',
  STREAK: '@earned_time_streak',
};

const MAX_HISTORY_ITEMS = 100;

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function EarnedTimeProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<EarnedTimeWallet>({
    totalEarned: 0,
    availableMinutes: 0,
    lastUpdated: Date.now(),
  });
  const [earningHistory, setEarningHistory] = useState<EarningRecord[]>([]);
  const [spendingHistory, setSpendingHistory] = useState<SpendingRecord[]>([]);
  const [todayUsage, setTodayUsage] = useState<DailyUsage>({
    date: getTodayDateString(),
    appUsage: {},
  });
  const [totalDailyLimit, setTotalDailyLimitState] = useState<number>(60); // Default 1 hour
  const [lastSyncedUsage, setLastSyncedUsage] = useState<Record<string, number>>({}); // packageName -> last synced minutes
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastEarningDate: '',
    streakShownToday: false,
  });

  // Load data on mount
  const loadData = useCallback(async () => {
    try {
      const [walletData, earningData, spendingData, usageData, storedTotalLimit, syncedUsageData, streakData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WALLET),
        AsyncStorage.getItem(STORAGE_KEYS.EARNING_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.SPENDING_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_USAGE),
        SecureStore.getItemAsync('totalDailyLimit'),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNCED_USAGE),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK),
      ]);

      if (walletData) {
        const storedWallet = JSON.parse(walletData);
        // On Android, get balance from native (single source of truth)
        if (Platform.OS === 'android') {
          try {
            const nativeBalance = await AppBlocker.getWalletBalance();
            console.log('[EarnedTime] loadData: native balance =', nativeBalance, 'type:', typeof nativeBalance);
            setWallet({
              ...storedWallet,
              availableMinutes: nativeBalance ?? 0,
              lastUpdated: Date.now(),
            });
          } catch (error) {
            console.error('[EarnedTime] Error getting wallet balance:', error);
            setWallet(storedWallet);
          }
        } else {
          setWallet(storedWallet);
        }
      } else if (Platform.OS === 'android') {
        // No stored wallet, but check native for any existing balance
        try {
          const nativeBalance = await AppBlocker.getWalletBalance();
          console.log('[EarnedTime] loadData (no stored): native balance =', nativeBalance, 'type:', typeof nativeBalance);
          setWallet({
            totalEarned: 0,
            availableMinutes: nativeBalance ?? 0,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          console.error('[EarnedTime] Error getting wallet balance (no stored):', error);
        }
      }

      if (earningData) {
        setEarningHistory(JSON.parse(earningData));
      }

      if (spendingData) {
        setSpendingHistory(JSON.parse(spendingData));
      }

      if (usageData) {
        const usage = JSON.parse(usageData) as DailyUsage;
        // Reset if it's a new day
        if (usage.date !== getTodayDateString()) {
          const newUsage = { date: getTodayDateString(), appUsage: {} };
          setTodayUsage(newUsage);
          await AsyncStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(newUsage));
          // Also reset synced usage for new day (both apps and websites)
          setLastSyncedUsage({});
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNCED_USAGE, JSON.stringify({}));
          // Reset website synced usage as well
          await AsyncStorage.setItem('@earned_time_last_synced_website_usage', JSON.stringify({}));
          console.log('[EarnedTime] Day changed, reset app and website sync data');
        } else {
          setTodayUsage(usage);
        }
      }

      if (storedTotalLimit) {
        const limit = parseInt(storedTotalLimit, 10);
        console.log('[EarnedTime] Loaded totalDailyLimit from storage:', limit);
        setTotalDailyLimitState(limit);
        // Sync to native for Android blocking screen
        if (Platform.OS === 'android') {
          AppBlocker.setTotalDailyLimit(limit);
        }
      } else {
        console.log('[EarnedTime] No stored totalDailyLimit, using default 60');
        // Sync default limit to native
        if (Platform.OS === 'android') {
          AppBlocker.setTotalDailyLimit(60); // Default 1 hour
        }
      }

      if (syncedUsageData) {
        setLastSyncedUsage(JSON.parse(syncedUsageData));
      }

      // Load streak data
      if (streakData) {
        const loadedStreak = JSON.parse(streakData) as StreakData;
        const today = getTodayDateString();

        // Reset streakShownToday if it's a new day
        if (loadedStreak.lastEarningDate !== today) {
          loadedStreak.streakShownToday = false;
        }

        // Check if streak is broken (more than 1 day since last earning)
        if (loadedStreak.lastEarningDate) {
          const lastDate = new Date(loadedStreak.lastEarningDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          // If more than 1 day has passed without earning, reset streak
          if (diffDays > 1) {
            loadedStreak.currentStreak = 0;
          }
        }

        setStreak(loadedStreak);
      }
    } catch (error) {
      console.error('Error loading earned time data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check and reset daily usage at midnight
  useEffect(() => {
    const checkDayChange = () => {
      const today = getTodayDateString();
      if (todayUsage.date !== today) {
        const newUsage = { date: today, appUsage: {} };
        setTodayUsage(newUsage);
        AsyncStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(newUsage));
      }
    };

    // Check every minute
    const interval = setInterval(checkDayChange, 60000);
    return () => clearInterval(interval);
  }, [todayUsage.date]);

  // Save wallet to storage
  const saveWallet = async (newWallet: EarnedTimeWallet) => {
    await AsyncStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(newWallet));
  };

  // Earn time
  const earnTime = async (
    type: EarningRecord['type'],
    minutes: number,
    details: string
  ) => {
    const record: EarningRecord = {
      id: Date.now().toString(),
      type,
      minutesEarned: minutes,
      details,
      timestamp: Date.now(),
    };

    let newAvailableMinutes = wallet.availableMinutes + minutes;

    // Update native (single source of truth) on Android
    if (Platform.OS === 'android') {
      console.log('[EarnedTime] earnTime: adding', minutes, 'minutes to wallet');
      const result = AppBlocker.addToWalletBalance(minutes);
      console.log('[EarnedTime] earnTime: addToWalletBalance returned', result, 'type:', typeof result);
      newAvailableMinutes = result ?? (wallet.availableMinutes + minutes);
      AppBlocker.addToEarnedToday(minutes);
      console.log('[EarnedTime] earnTime: new balance =', newAvailableMinutes);
    }

    const newWallet: EarnedTimeWallet = {
      totalEarned: wallet.totalEarned + minutes,
      availableMinutes: newAvailableMinutes,
      lastUpdated: Date.now(),
    };

    const newHistory = [record, ...earningHistory].slice(0, MAX_HISTORY_ITEMS);

    // Update streak
    const today = getTodayDateString();
    let newStreak = { ...streak };

    if (streak.lastEarningDate !== today) {
      // First earning of the day - check if continuing streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (streak.lastEarningDate === yesterdayStr) {
        // Continuing streak from yesterday
        newStreak.currentStreak = streak.currentStreak + 1;
      } else if (streak.lastEarningDate === '') {
        // First ever earning
        newStreak.currentStreak = 1;
      } else {
        // Streak broken, start fresh
        newStreak.currentStreak = 1;
      }

      newStreak.lastEarningDate = today;
      // Update longest streak if needed
      if (newStreak.currentStreak > newStreak.longestStreak) {
        newStreak.longestStreak = newStreak.currentStreak;
      }
    }
    // If already earned today, streak stays the same

    setWallet(newWallet);
    setEarningHistory(newHistory);
    setStreak(newStreak);

    await Promise.all([
      saveWallet(newWallet),
      AsyncStorage.setItem(STORAGE_KEYS.EARNING_HISTORY, JSON.stringify(newHistory)),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(newStreak)),
    ]);
  };

  // Spend time
  const spendTime = async (
    packageName: string,
    appName: string,
    minutes: number
  ): Promise<boolean> => {
    // Check balance - use native on Android
    let currentBalance = wallet.availableMinutes;
    if (Platform.OS === 'android') {
      currentBalance = await AppBlocker.getWalletBalance();
    }

    if (currentBalance < minutes) {
      return false;
    }

    const record: SpendingRecord = {
      id: Date.now().toString(),
      packageName,
      appName,
      minutesSpent: minutes,
      wasScheduleFree: false,
      timestamp: Date.now(),
    };

    // Update native (single source of truth) on Android
    let newAvailableMinutes = wallet.availableMinutes - minutes;
    if (Platform.OS === 'android') {
      newAvailableMinutes = AppBlocker.deductFromWalletBalance(minutes);
    }

    const newWallet: EarnedTimeWallet = {
      ...wallet,
      availableMinutes: newAvailableMinutes,
      lastUpdated: Date.now(),
    };

    const newHistory = [record, ...spendingHistory].slice(0, MAX_HISTORY_ITEMS);

    // Update daily usage
    const newUsage: DailyUsage = {
      ...todayUsage,
      appUsage: {
        ...todayUsage.appUsage,
        [packageName]: (todayUsage.appUsage[packageName] || 0) + minutes,
      },
    };

    setWallet(newWallet);
    setSpendingHistory(newHistory);
    setTodayUsage(newUsage);

    await Promise.all([
      saveWallet(newWallet),
      AsyncStorage.setItem(STORAGE_KEYS.SPENDING_HISTORY, JSON.stringify(newHistory)),
      AsyncStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(newUsage)),
    ]);

    return true;
  };

  // Urgent spend - allows going negative for emergency access
  const urgentSpend = async (
    packageName: string,
    appName: string,
    minutes: number
  ): Promise<void> => {
    const record: SpendingRecord = {
      id: Date.now().toString(),
      packageName,
      appName,
      minutesSpent: minutes,
      wasScheduleFree: false,
      timestamp: Date.now(),
    };

    // Update native (single source of truth) on Android - can go negative
    let newAvailableMinutes = wallet.availableMinutes - minutes;
    if (Platform.OS === 'android') {
      newAvailableMinutes = AppBlocker.deductFromWalletBalance(minutes);
    }

    // Allow going negative
    const newWallet: EarnedTimeWallet = {
      ...wallet,
      availableMinutes: newAvailableMinutes, // Can be negative
      lastUpdated: Date.now(),
    };

    const newHistory = [record, ...spendingHistory].slice(0, MAX_HISTORY_ITEMS);

    // Update daily usage
    const newUsage: DailyUsage = {
      ...todayUsage,
      appUsage: {
        ...todayUsage.appUsage,
        [packageName]: (todayUsage.appUsage[packageName] || 0) + minutes,
      },
    };

    setWallet(newWallet);
    setSpendingHistory(newHistory);
    setTodayUsage(newUsage);

    await Promise.all([
      saveWallet(newWallet),
      AsyncStorage.setItem(STORAGE_KEYS.SPENDING_HISTORY, JSON.stringify(newHistory)),
      AsyncStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(newUsage)),
    ]);
  };

  // Record free usage during schedule
  const recordFreeUsage = async (
    packageName: string,
    appName: string,
    minutes: number
  ) => {
    const record: SpendingRecord = {
      id: Date.now().toString(),
      packageName,
      appName,
      minutesSpent: minutes,
      wasScheduleFree: true,
      timestamp: Date.now(),
    };

    const newHistory = [record, ...spendingHistory].slice(0, MAX_HISTORY_ITEMS);

    // Update daily usage (still counts toward limit)
    const newUsage: DailyUsage = {
      ...todayUsage,
      appUsage: {
        ...todayUsage.appUsage,
        [packageName]: (todayUsage.appUsage[packageName] || 0) + minutes,
      },
    };

    setSpendingHistory(newHistory);
    setTodayUsage(newUsage);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.SPENDING_HISTORY, JSON.stringify(newHistory)),
      AsyncStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(newUsage)),
    ]);
  };

  // Get remaining limit for an app
  const getRemainingLimit = (packageName: string, dailyLimitMinutes: number): number => {
    const usedToday = todayUsage.appUsage[packageName] || 0;
    return Math.max(0, dailyLimitMinutes - usedToday);
  };

  // Get total usage today (all apps combined)
  const getTotalUsageToday = (): number => {
    return Object.values(todayUsage.appUsage).reduce((sum, usage) => sum + usage, 0);
  };

  // Get total remaining limit
  const getTotalRemainingLimit = (): number => {
    const totalUsed = getTotalUsageToday();
    return Math.max(0, totalDailyLimit - totalUsed);
  };

  // Set total daily limit
  const setTotalDailyLimit = async (minutes: number) => {
    console.log('[EarnedTime] setTotalDailyLimit called with:', minutes);
    setTotalDailyLimitState(minutes);
    await SecureStore.setItemAsync('totalDailyLimit', minutes.toString());
    console.log('[EarnedTime] Saved totalDailyLimit to SecureStore:', minutes);
    // Sync to native for Android blocking screen
    if (Platform.OS === 'android') {
      AppBlocker.setTotalDailyLimit(minutes);
    }
  };

  // Check if user can use an app
  const canUseApp = (packageName: string, dailyLimitMinutes: number) => {
    const remainingLimit = getRemainingLimit(packageName, dailyLimitMinutes);
    const availableMinutes = wallet.availableMinutes;
    const totalRemainingLimit = getTotalRemainingLimit();

    // First check total daily limit
    if (totalRemainingLimit <= 0) {
      return {
        canUse: false,
        reason: 'total_limit_reached' as const,
        remainingLimit,
        availableMinutes,
        totalRemainingLimit: 0,
      };
    }

    // Then check individual app limit
    if (remainingLimit <= 0) {
      return {
        canUse: false,
        reason: 'limit_reached' as const,
        remainingLimit: 0,
        availableMinutes,
        totalRemainingLimit,
      };
    }

    // Then check balance
    if (availableMinutes <= 0) {
      return {
        canUse: false,
        reason: 'no_balance' as const,
        remainingLimit,
        availableMinutes: 0,
        totalRemainingLimit,
      };
    }

    return {
      canUse: true,
      reason: 'ok' as const,
      remainingLimit,
      availableMinutes,
      totalRemainingLimit,
    };
  };

  // State for native values (updated periodically)
  const [nativeSpentToday, setNativeSpentToday] = useState<number>(0);
  const [nativeEarnedToday, setNativeEarnedToday] = useState<number>(0);

  // Refresh native stats periodically
  useEffect(() => {
    const refreshNativeStats = async () => {
      if (Platform.OS === 'android') {
        try {
          const [spent, earned] = await Promise.all([
            AppBlocker.getTotalSpentToday(),
            AppBlocker.getTotalEarnedToday(),
          ]);
          setNativeSpentToday(spent);
          setNativeEarnedToday(earned);
        } catch (e) {
          console.error('[EarnedTime] Error refreshing native stats:', e);
        }
      }
    };

    refreshNativeStats();
    const interval = setInterval(refreshNativeStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Get today's earnings - from native on Android
  const getTodayEarned = (): number => {
    if (Platform.OS === 'android') {
      return nativeEarnedToday;
    }
    // iOS fallback: use history
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return earningHistory
      .filter(r => r.timestamp >= todayStart.getTime())
      .reduce((sum, r) => sum + r.minutesEarned, 0);
  };

  // Get today's spending - from native on Android
  const getTodaySpent = (): number => {
    if (Platform.OS === 'android') {
      return nativeSpentToday;
    }
    // iOS fallback: use history
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return spendingHistory
      .filter(r => r.timestamp >= todayStart.getTime() && !r.wasScheduleFree)
      .reduce((sum, r) => sum + r.minutesSpent, 0);
  };

  // Get week stats
  const getWeekStats = () => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const earned = earningHistory
      .filter(r => r.timestamp >= weekAgo)
      .reduce((sum, r) => sum + r.minutesEarned, 0);

    const spent = spendingHistory
      .filter(r => r.timestamp >= weekAgo && !r.wasScheduleFree)
      .reduce((sum, r) => sum + r.minutesSpent, 0);

    return { earned, spent };
  };

  // Get stats for a specific day
  const getDayStats = (date: Date): { earned: number; spent: number } => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const earned = earningHistory
      .filter(r => r.timestamp >= dayStart.getTime() && r.timestamp <= dayEnd.getTime())
      .reduce((sum, r) => sum + r.minutesEarned, 0);

    const spent = spendingHistory
      .filter(r => r.timestamp >= dayStart.getTime() && r.timestamp <= dayEnd.getTime() && !r.wasScheduleFree)
      .reduce((sum, r) => sum + r.minutesSpent, 0);

    return { earned, spent };
  };

  // Get daily stats for the current week (Mon-Sun)
  // Uses native values for today on Android
  const getWeeklyDailyStats = (t?: (key: string) => string): { day: string; earned: number; spent: number; isToday: boolean }[] => {
    const days = t ? [
      t("common.dayNames.mon"),
      t("common.dayNames.tue"),
      t("common.dayNames.wed"),
      t("common.dayNames.thu"),
      t("common.dayNames.fri"),
      t("common.dayNames.sat"),
      t("common.dayNames.sun"),
    ] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since Monday

    // Get the Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      const isToday = index === mondayOffset;

      // For today, use native values on Android
      if (isToday && Platform.OS === 'android') {
        return {
          day,
          earned: nativeEarnedToday,
          spent: nativeSpentToday,
          isToday: true,
        };
      }

      // For other days, use history
      const stats = getDayStats(date);
      return {
        day,
        earned: stats.earned,
        spent: stats.spent,
        isToday,
      };
    });
  };

  // Sync React state with native - simplified, native is source of truth
  const syncUsageWithWallet = async (realUsageMap: Record<string, number>): Promise<number> => {
    if (Platform.OS !== 'android') return 0;

    try {
      // Just sync React wallet state with native
      const nativeBalance = await AppBlocker.getWalletBalance();
      setWallet(prev => ({
        ...prev,
        availableMinutes: nativeBalance,
        lastUpdated: Date.now(),
      }));

      // Update todayUsage for display
      const newUsage: DailyUsage = {
        date: getTodayDateString(),
        appUsage: { ...realUsageMap },
      };
      setTodayUsage(newUsage);

      return 0; // Native handles deductions
    } catch (error) {
      console.error('[EarnedTime] Error syncing with native:', error);
      return 0;
    }
  };

  // Sync website usage - simplified, native is source of truth
  const syncWebsiteUsageWithWallet = async (websiteUsageMap: Record<string, number>): Promise<number> => {
    if (Platform.OS !== 'android') return 0;

    try {
      // Just sync React wallet state with native
      const nativeBalance = await AppBlocker.getWalletBalance();
      setWallet(prev => ({
        ...prev,
        availableMinutes: nativeBalance,
        lastUpdated: Date.now(),
      }));

      // Update todayUsage with website data for display
      const updatedUsage: DailyUsage = {
        ...todayUsage,
        appUsage: { ...todayUsage.appUsage },
      };
      for (const [website, minutes] of Object.entries(websiteUsageMap)) {
        if (minutes > 0) {
          updatedUsage.appUsage[`website:${website}`] = minutes;
        }
      }
      setTodayUsage(updatedUsage);

      return 0; // Native handles deductions
    } catch (error) {
      console.error('[EarnedTime] Error syncing website usage:', error);
      return 0;
    }
  };

  // Sync native app usage - simplified, native is source of truth
  const syncNativeAppUsageWithWallet = async (): Promise<number> => {
    if (Platform.OS !== 'android') return 0;

    try {
      // Get native app usage for display
      const nativeUsageMap = await AppBlocker.getNativeAppUsageToday();

      // Sync React wallet state with native
      const nativeBalance = await AppBlocker.getWalletBalance();
      setWallet(prev => ({
        ...prev,
        availableMinutes: nativeBalance,
        lastUpdated: Date.now(),
      }));

      // Update todayUsage with native app usage for display
      if (Object.keys(nativeUsageMap).length > 0) {
        const updatedUsage: DailyUsage = {
          ...todayUsage,
          appUsage: { ...todayUsage.appUsage },
        };
        for (const [packageName, minutes] of Object.entries(nativeUsageMap)) {
          if (minutes > 0) {
            updatedUsage.appUsage[packageName] = minutes;
          }
        }
        setTodayUsage(updatedUsage);
      }

      return 0; // Native handles deductions
    } catch (error) {
      console.error('[EarnedTime] Error syncing native app usage:', error);
      return 0;
    }
  };

  // Reset wallet to a specific amount and clear synced usage
  const resetWallet = async (minutes: number) => {
    // Update native (single source of truth) on Android
    if (Platform.OS === 'android') {
      AppBlocker.setWalletBalance(minutes);
    }

    const newWallet: EarnedTimeWallet = {
      totalEarned: minutes,
      availableMinutes: minutes,
      lastUpdated: Date.now(),
    };

    setWallet(newWallet);
    setLastSyncedUsage({});

    await Promise.all([
      saveWallet(newWallet),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNCED_USAGE, JSON.stringify({})),
    ]);

    console.log(`[EarnedTime] Wallet reset to ${minutes} minutes`);
  };

  const refreshData = loadData;

  // Check if this is the first earning of the day (for streak modal)
  const isFirstEarningToday = (): boolean => {
    const today = getTodayDateString();
    // It's the first earning if we haven't shown the streak today AND
    // the last earning date is not today (meaning earnTime will update streak)
    return !streak.streakShownToday && streak.lastEarningDate !== today;
  };

  // Mark streak modal as shown for today
  const markStreakShown = async (): Promise<void> => {
    const newStreak = { ...streak, streakShownToday: true };
    setStreak(newStreak);
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(newStreak));
  };

  // Record activity for streak purposes (used by photo tasks that don't earn time)
  // Returns true if it was the first activity of the day (to trigger streak modal)
  const recordActivity = async (): Promise<boolean> => {
    const today = getTodayDateString();

    // If already recorded activity today, return false
    if (streak.lastEarningDate === today) {
      return false;
    }

    // Update streak
    let newStreak = { ...streak };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastEarningDate === yesterdayStr) {
      // Continuing streak from yesterday
      newStreak.currentStreak = streak.currentStreak + 1;
    } else if (streak.lastEarningDate === '') {
      // First ever activity
      newStreak.currentStreak = 1;
    } else {
      // Streak broken, start fresh
      newStreak.currentStreak = 1;
    }

    newStreak.lastEarningDate = today;
    // Update longest streak if needed
    if (newStreak.currentStreak > newStreak.longestStreak) {
      newStreak.longestStreak = newStreak.currentStreak;
    }

    setStreak(newStreak);
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(newStreak));

    return true; // This was the first activity of the day
  };

  return (
    <EarnedTimeContext.Provider
      value={{
        wallet,
        earningHistory,
        spendingHistory,
        todayUsage,
        nativeSpentToday,
        nativeEarnedToday,
        totalDailyLimit,
        setTotalDailyLimit,
        earnTime,
        spendTime,
        urgentSpend,
        canUseApp,
        recordFreeUsage,
        getRemainingLimit,
        getTotalUsageToday,
        getTotalRemainingLimit,
        getTodayEarned,
        getTodaySpent,
        getWeekStats,
        getDayStats,
        getWeeklyDailyStats,
        syncUsageWithWallet,
        syncWebsiteUsageWithWallet,
        syncNativeAppUsageWithWallet,
        resetWallet,
        refreshData,
        streak,
        isFirstEarningToday,
        markStreakShown,
        recordActivity,
      }}
    >
      {children}
    </EarnedTimeContext.Provider>
  );
}

export function useEarnedTime() {
  const context = useContext(EarnedTimeContext);
  if (context === undefined) {
    throw new Error('useEarnedTime must be used within an EarnedTimeProvider');
  }
  return context;
}
