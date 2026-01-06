import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
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

  const { urgentSpend, syncUsageWithWallet } = useEarnedTime();
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

  // Get list of blocked app package names
  const blockedPackages = dailyLimits.map(l => l.packageName);

  // Fetch real device usage for this app and sync with wallet
  useEffect(() => {
    const fetchRealUsage = async () => {
      try {
        const todayStats = await UsageStats.getTodayUsageStats();
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

          // Get this app's usage
          const thisAppUsage = usageMap[packageName] || 0;
          setRealUsedMinutes(thisAppUsage);
          console.log(`[BlockedApp] Real usage for ${appName}: ${thisAppUsage} minutes`);
        }
      } catch (error) {
        console.error('[BlockedApp] Error fetching usage stats:', error);
      }
    };
    fetchRealUsage();
  }, [packageName, appName, syncUsageWithWallet, blockedPackages]);

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
    console.log(`[BlockedApp] Opening ${appName} (single entry - time tracked automatically)`);

    try {
      // Set a short temp unblock just to allow app to launch (10 seconds)
      // Time is tracked automatically via UsageStats sync
      // Shield will show again on every re-entry
      AppBlocker.setTempUnblock(packageName, 1); // ~1 minute buffer for launch
      console.log('[BlockedApp] Single entry pass set');

      // Launch the app
      const launched = AppBlocker.launchApp(packageName);
      console.log('[BlockedApp] App launch result:', launched);

      if (!launched) {
        console.log('[BlockedApp] Could not launch app directly');
      }
    } catch (error) {
      console.error('[BlockedApp] Error opening app:', error);
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
    console.log(`[BlockedApp] Urgent access for ${appName}`);

    try {
      // Deduct from wallet (can go negative for urgent access)
      await urgentSpend(packageName, appName, minutes);

      // Set a short temp unblock just to allow app to launch
      // Shield will show again on every re-entry
      AppBlocker.setTempUnblock(packageName, 1); // ~1 minute buffer for launch
      console.log('[BlockedApp] Urgent single entry pass set');

      // Launch the app
      const launched = AppBlocker.launchApp(packageName);
      console.log('[BlockedApp] Urgent app launch result:', launched);
    } catch (error) {
      console.error('[BlockedApp] Error with urgent access:', error);
    }

    setVisible(false);
    router.back(); // Remove blocked-app screen from navigation stack
  };

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
        onClose={handleClose}
        onSpend={handleSpend}
        onEarnTime={handleEarnTime}
        onUrgentAccess={handleUrgentAccess}
      />
    </View>
  );
}
