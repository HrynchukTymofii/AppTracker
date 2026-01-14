import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, BackHandler, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SpendTimeModal } from '@/components/modals/SpendTimeModal';
import { useEarnedTime } from '@/context/EarnedTimeContext';
import { useBlocking } from '@/context/BlockingContext';
import * as AppBlocker from '@/modules/app-blocker';
import * as UsageStats from '@/modules/usage-stats';

export default function BlockedAppScreen() {
  const router = useRouter(); // Keep for onEarnTime navigation
  const params = useLocalSearchParams<{ packageName: string; appName: string; showCoachChat?: string }>();
  const [visible, setVisible] = useState(true);
  const [realUsedMinutes, setRealUsedMinutes] = useState(0);
  const [nativeWalletBalance, setNativeWalletBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { urgentSpend, syncUsageWithWallet, spendTime } = useEarnedTime();
  const { dailyLimits } = useBlocking();

  const packageName = params.packageName || '';
  const appName = params.appName || packageName;
  // If native screen says show coach chat, user has hit limit - set high usage to trigger coach chat view
  const forceCoachChat = params.showCoachChat === 'true';

  // Get daily limit for this app (default 30 min if not set)
  const appLimit = dailyLimits.find(l => l.packageName === packageName);
  const dailyLimitMinutes = appLimit?.limitMinutes || 30;

  // Schedule functionality removed - always false
  const isScheduleFreeTime = false;

  console.log('[BlockedApp] Screen loaded with:', {
    packageName,
    appName,
    dailyLimitMinutes,
    hasAppLimit: !!appLimit,
    forceCoachChat,
  });

  // Get list of blocked app package names - memoized to prevent infinite re-renders
  const blockedPackages = useMemo(() => dailyLimits.map(l => l.packageName), [dailyLimits]);

  // Fetch all required data on mount - only run once
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        // Fetch wallet balance and usage stats in parallel
        const [balance, todayStats] = await Promise.all([
          AppBlocker.getWalletBalance(),
          UsageStats.getTodayUsageStats(),
        ]);

        if (!isMounted) return;

        console.log('[BlockedApp] Native wallet balance:', balance);
        setNativeWalletBalance(balance);

        if (todayStats.hasPermission && todayStats.apps) {
          // Build usage map for ONLY blocked apps
          const usageMap: Record<string, number> = {};
          for (const app of todayStats.apps) {
            // Only track apps that are in our blocked list
            if (blockedPackages.includes(app.packageName)) {
              const usedMins = Math.round(app.timeInForeground / (1000 * 60));
              if (usedMins > 0) {
                usageMap[app.packageName] = usedMins;
              }
            }
          }

          // Sync with wallet to deduct actual usage (only for blocked apps)
          await syncUsageWithWallet(usageMap);

          if (!isMounted) return;

          // Get this app's usage
          const thisAppUsage = usageMap[packageName] || 0;
          setRealUsedMinutes(thisAppUsage);
          console.log(`[BlockedApp] Real usage for ${appName}: ${thisAppUsage} minutes, limit: ${dailyLimitMinutes}`);
        }
      } catch (error) {
        console.error('[BlockedApp] Error fetching data:', error);
        if (isMounted) setNativeWalletBalance(0);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [packageName]); // Only depend on packageName to run once per app

  // Prevent back button from bypassing the block
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const goHome = () => {
    console.log('[BlockedApp] Going to phone home screen');
    setVisible(false);
    router.back(); // Remove blocked-app screen from navigation stack
    AppBlocker.goToHomeScreen(); // Go to phone's home screen
  };

  const handleClose = () => {
    goHome();
  };

  const handleSpend = async (minutes: number) => {
    console.log(`[BlockedApp] Spending ${minutes} min on ${appName}`);

    try {
      // Get actual available minutes from native (single source of truth)
      const availableMinutes = await AppBlocker.getWalletBalance();

      // Calculate how much to actually spend (min of requested and available)
      const actualSpend = Math.min(minutes, availableMinutes);

      if (actualSpend > 0) {
        // Record spending in context (this updates spendingHistory and native values)
        const success = await spendTime(packageName, appName, actualSpend);
        if (!success) {
          console.warn('[BlockedApp] spendTime returned false - insufficient balance');
        }
        console.log(`[BlockedApp] Recorded ${actualSpend} min spend for ${appName}`);
      }

      // Set temp unblock for actual available time (minimum 1 minute for launch)
      const unblockMinutes = Math.max(1, availableMinutes);

      if (packageName.startsWith('website:')) {
        const website = packageName.replace('website:', '');
        AppBlocker.setTempUnblockWebsite(website, unblockMinutes);
        console.log(`[BlockedApp] Website temp unblock set for ${unblockMinutes} minutes:`, website);
      } else {
        AppBlocker.setTempUnblock(packageName, unblockMinutes);
        console.log(`[BlockedApp] App temp unblock set for ${unblockMinutes} minutes`);

        // Launch the app
        const launched = AppBlocker.launchApp(packageName);
        console.log('[BlockedApp] App launch result:', launched);
      }
    } catch (error) {
      console.error('[BlockedApp] Error spending time:', error);
    }

    setVisible(false);
    router.back(); // Remove blocked-app screen from navigation stack
  };

  const handleEarnTime = () => {
    // Navigate to LockIn tab to earn time
    setVisible(false);
    router.replace('/(tabs)/lockin');
  };

  const handleUrgentAccess = async (minutes: number) => {
    console.log(`[BlockedApp] Urgent access for ${appName} - ${minutes} minutes`);

    try {
      // Deduct from wallet (can go negative for urgent access)
      await urgentSpend(packageName, appName, minutes);

      // Set temp unblock for the requested urgent access time
      if (packageName.startsWith('website:')) {
        const website = packageName.replace('website:', '');
        AppBlocker.setTempUnblockWebsite(website, minutes);
        console.log(`[BlockedApp] Urgent website pass set for ${minutes} minutes:`, website);
      } else {
        AppBlocker.setTempUnblock(packageName, minutes);
        console.log(`[BlockedApp] Urgent app pass set for ${minutes} minutes`);

        // Launch the app
        const launched = AppBlocker.launchApp(packageName);
        console.log('[BlockedApp] Urgent app launch result:', launched);
      }
    } catch (error) {
      console.error('[BlockedApp] Error with urgent access:', error);
    }

    setVisible(false);
    router.back(); // Remove blocked-app screen from navigation stack
  };

  // Show loading while fetching data to avoid showing wrong screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SpendTimeModal
        visible={visible}
        appName={appName}
        packageName={packageName}
        dailyLimitMinutes={dailyLimitMinutes}
        realUsedMinutes={forceCoachChat ? dailyLimitMinutes : realUsedMinutes}
        isScheduleFreeTime={isScheduleFreeTime}
        forceCoachChat={forceCoachChat}
        nativeWalletBalance={nativeWalletBalance}
        onClose={handleClose}
        onSpend={handleSpend}
        onEarnTime={handleEarnTime}
        onUrgentAccess={handleUrgentAccess}
      />
    </View>
  );
}
