import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IntentionModal } from '@/components/modals/IntentionModal';
import * as AppBlocker from '@/modules/app-blocker';

export default function BlockedAppScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ packageName: string; appName: string }>();
  const [visible, setVisible] = useState(true);

  const packageName = params.packageName || '';
  const appName = params.appName || packageName;

  console.log('[BlockedApp] Screen loaded with:', { packageName, appName });

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

  const handleAllow = async (minutes: number) => {
    console.log(`[BlockedApp] Allowing ${appName} for ${minutes} minutes`);

    try {
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
      console.error('[BlockedApp] Error allowing app:', error);
    }

    setVisible(false);
    // Don't navigate away - the app should now be in foreground
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <IntentionModal
        visible={visible}
        appName={appName}
        healthScore={50} // TODO: Get actual health score from context
        onClose={handleClose}
        onAllow={handleAllow}
      />
    </View>
  );
}
