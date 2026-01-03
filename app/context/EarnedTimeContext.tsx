import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Types
export interface EarnedTimeWallet {
  totalEarned: number;       // Total minutes ever earned (for stats)
  availableMinutes: number;  // Current spendable balance
  lastUpdated: number;
}

export interface EarningRecord {
  id: string;
  type: 'pushups' | 'squats' | 'plank' | 'photo_task' | 'custom';
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

  // Sync real usage with wallet
  syncUsageWithWallet: (realUsageMap: Record<string, number>) => Promise<number>;

  // Reset wallet to a specific amount (for fixing issues)
  resetWallet: (minutes: number) => Promise<void>;

  // Refresh data
  refreshData: () => Promise<void>;
}

const EarnedTimeContext = createContext<EarnedTimeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WALLET: '@earned_time_wallet',
  EARNING_HISTORY: '@earned_time_earning_history',
  SPENDING_HISTORY: '@earned_time_spending_history',
  DAILY_USAGE: '@earned_time_daily_usage',
  LAST_SYNCED_USAGE: '@earned_time_last_synced_usage',
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

  // Load data on mount
  const loadData = useCallback(async () => {
    try {
      const [walletData, earningData, spendingData, usageData, storedTotalLimit, syncedUsageData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WALLET),
        AsyncStorage.getItem(STORAGE_KEYS.EARNING_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.SPENDING_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_USAGE),
        SecureStore.getItemAsync('totalDailyLimit'),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNCED_USAGE),
      ]);

      if (walletData) {
        setWallet(JSON.parse(walletData));
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
          // Also reset synced usage for new day
          setLastSyncedUsage({});
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNCED_USAGE, JSON.stringify({}));
        } else {
          setTodayUsage(usage);
        }
      }

      if (storedTotalLimit) {
        setTotalDailyLimitState(parseInt(storedTotalLimit, 10));
      }

      if (syncedUsageData) {
        setLastSyncedUsage(JSON.parse(syncedUsageData));
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

    const newWallet: EarnedTimeWallet = {
      totalEarned: wallet.totalEarned + minutes,
      availableMinutes: wallet.availableMinutes + minutes,
      lastUpdated: Date.now(),
    };

    const newHistory = [record, ...earningHistory].slice(0, MAX_HISTORY_ITEMS);

    setWallet(newWallet);
    setEarningHistory(newHistory);

    await Promise.all([
      saveWallet(newWallet),
      AsyncStorage.setItem(STORAGE_KEYS.EARNING_HISTORY, JSON.stringify(newHistory)),
    ]);
  };

  // Spend time
  const spendTime = async (
    packageName: string,
    appName: string,
    minutes: number
  ): Promise<boolean> => {
    if (wallet.availableMinutes < minutes) {
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

    const newWallet: EarnedTimeWallet = {
      ...wallet,
      availableMinutes: wallet.availableMinutes - minutes,
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

    // Allow going negative
    const newWallet: EarnedTimeWallet = {
      ...wallet,
      availableMinutes: wallet.availableMinutes - minutes, // Can be negative
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
    setTotalDailyLimitState(minutes);
    await SecureStore.setItemAsync('totalDailyLimit', minutes.toString());
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

  // Get today's earnings
  const getTodayEarned = (): number => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return earningHistory
      .filter(r => r.timestamp >= todayStart.getTime())
      .reduce((sum, r) => sum + r.minutesEarned, 0);
  };

  // Get today's spending
  const getTodaySpent = (): number => {
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

  // Sync real device usage with wallet - deducts actual usage from earned time
  // Only syncs apps that have been previously tracked (not first time usage)
  const syncUsageWithWallet = async (realUsageMap: Record<string, number>): Promise<number> => {
    let totalDeducted = 0;
    const newSyncedUsage = { ...lastSyncedUsage };
    let hasChanges = false;

    // Calculate delta for each app
    for (const [packageName, realMinutes] of Object.entries(realUsageMap)) {
      const lastSynced = lastSyncedUsage[packageName];

      // If this is the first time seeing this app, just record current usage (don't deduct)
      if (lastSynced === undefined) {
        newSyncedUsage[packageName] = realMinutes;
        hasChanges = true;
        console.log(`[EarnedTime] First sync for ${packageName}: initialized at ${realMinutes} min`);
        continue;
      }

      // Calculate delta from last sync
      const delta = Math.max(0, realMinutes - lastSynced);

      if (delta > 0) {
        totalDeducted += delta;
        newSyncedUsage[packageName] = realMinutes;
        hasChanges = true;
        console.log(`[EarnedTime] Sync: ${packageName} used ${delta} more minutes (${lastSynced} -> ${realMinutes})`);
      }
    }

    if (hasChanges) {
      setLastSyncedUsage(newSyncedUsage);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNCED_USAGE, JSON.stringify(newSyncedUsage));
    }

    if (totalDeducted > 0) {
      // Deduct from wallet
      const newWallet: EarnedTimeWallet = {
        ...wallet,
        availableMinutes: wallet.availableMinutes - totalDeducted,
        lastUpdated: Date.now(),
      };

      setWallet(newWallet);
      await saveWallet(newWallet);

      // Add to spending history so it shows in "spent" stats
      // Create a combined record for all synced apps
      const newSpendRecord: SpendingRecord = {
        id: `sync_${Date.now()}`,
        packageName: 'sync',
        appName: 'Real Usage Sync',
        minutesSpent: totalDeducted,
        timestamp: Date.now(),
        wasScheduleFree: false,
        wasUrgent: false,
      };

      const updatedSpendingHistory = [...spendingHistory, newSpendRecord].slice(0, MAX_HISTORY_ITEMS);
      setSpendingHistory(updatedSpendingHistory);
      await AsyncStorage.setItem(STORAGE_KEYS.SPENDING_HISTORY, JSON.stringify(updatedSpendingHistory));

      console.log(`[EarnedTime] Synced: deducted ${totalDeducted} minutes, new balance: ${newWallet.availableMinutes}`);
    }

    return totalDeducted;
  };

  // Reset wallet to a specific amount and clear synced usage
  const resetWallet = async (minutes: number) => {
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

  return (
    <EarnedTimeContext.Provider
      value={{
        wallet,
        earningHistory,
        spendingHistory,
        todayUsage,
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
        syncUsageWithWallet,
        resetWallet,
        refreshData,
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
