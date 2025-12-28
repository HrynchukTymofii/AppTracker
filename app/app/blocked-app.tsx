import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SpendTimeModal } from '@/components/modals/SpendTimeModal';
import { useEarnedTime } from '@/context/EarnedTimeContext';
import { useBlocking } from '@/context/BlockingContext';
import * as AppBlocker from '@/modules/app-blocker';

export default function BlockedAppScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ packageName: string; appName: string }>();
  const [visible, setVisible] = useState(true);

  const { spendTime, recordFreeUsage } = useEarnedTime();
  const { dailyLimits, schedules } = useBlocking();

  const packageName = params.packageName || '';
  const appName = params.appName || packageName;

  console.log('[BlockedApp] Screen loaded with:', { packageName, appName });

  // Get daily limit for this app (default 30 min if not set)
  const appLimit = dailyLimits.find(l => l.packageName === packageName);
  const dailyLimitMinutes = appLimit?.limitMinutes || 30;

  // Check if currently in a free schedule period
  const isScheduleFreeTime = checkIfScheduleFreeTime(schedules, packageName);

  // Prevent back button from bypassing the block
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const goHome = () => {
    console.log('[BlockedApp] Going home');
    setVisible(false);
    router.replace('/(tabs)');
  };

  const handleClose = () => {
    goHome();
  };

  const handleSpend = async (minutes: number) => {
    console.log(`[BlockedApp] Spending ${minutes} minutes for ${appName}`);

    try {
      if (isScheduleFreeTime) {
        // Record usage but don't deduct from wallet
        await recordFreeUsage(packageName, appName, minutes);
      } else {
        // Deduct from wallet
        const success = await spendTime(packageName, appName, minutes);
        if (!success) {
          console.log('[BlockedApp] Insufficient balance');
          return;
        }
      }

      // Store temporary unblock
      AppBlocker.setTempUnblock(packageName, minutes);
      console.log('[BlockedApp] Temp unblock set');

      // Launch the app
      const launched = AppBlocker.launchApp(packageName);
      console.log('[BlockedApp] App launch result:', launched);

      if (!launched) {
        console.log('[BlockedApp] Could not launch app directly');
      }
    } catch (error) {
      console.error('[BlockedApp] Error spending time:', error);
    }

    setVisible(false);
  };

  const handleEarnTime = () => {
    // Navigate to LockIn tab to earn time
    setVisible(false);
    router.replace('/(tabs)/lockin');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SpendTimeModal
        visible={visible}
        appName={appName}
        packageName={packageName}
        dailyLimitMinutes={dailyLimitMinutes}
        isScheduleFreeTime={isScheduleFreeTime}
        onClose={handleClose}
        onSpend={handleSpend}
        onEarnTime={handleEarnTime}
      />
    </View>
  );
}

// Helper function to check if currently in a free schedule period
function checkIfScheduleFreeTime(schedules: any[], packageName: string): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  for (const schedule of schedules) {
    // Check if schedule is active and includes this app
    if (!schedule.isActive) continue;
    if (!schedule.apps.includes(packageName)) continue;
    if (!schedule.daysOfWeek.includes(currentDay)) continue;

    // Check if schedule type is 'unlock' (free time)
    if (schedule.type !== 'unlock') continue;

    // Parse start and end times
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Check if current time is within the schedule
    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
      return true;
    }
  }

  return false;
}
