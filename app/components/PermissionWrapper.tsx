import React, { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionRequest } from './modals/PermissionRequest';
import { hasUsageStatsPermission } from '@/modules/usage-stats';
import { useColorScheme } from '@/hooks/useColorScheme';

const PERMISSION_REQUESTED_KEY = '@permission_requested';

export function PermissionWrapper({ children }: { children: React.ReactNode }) {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkPermission();
  }, []);

  // Listen for app state changes (when user returns from settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [showPermissionModal]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // When app becomes active (user returns from settings)
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Only recheck if modal is currently shown
      if (showPermissionModal) {
        await recheckPermission();
      }
    }
    appState.current = nextAppState;
  };

  const recheckPermission = async () => {
    try {
      const hasPermission = await hasUsageStatsPermission();

      if (hasPermission) {
        // Permission granted! Close modal and mark as complete
        await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
        setShowPermissionModal(false);
      }
    } catch (error) {
      console.error('Error rechecking permission:', error);
    }
  };

  const checkPermission = async () => {
    try {
      // Check if we've already requested permission
      const permissionRequested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);

      if (!permissionRequested) {
        // First time opening the app, check if permission is already granted
        const hasPermission = await hasUsageStatsPermission();

        if (!hasPermission) {
          // Show permission request modal
          setShowPermissionModal(true);
        } else {
          // Permission already granted, mark as requested
          await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
        }
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const handleClosePermissionModal = async () => {
    // Mark that we've shown the permission request
    await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
    setShowPermissionModal(false);
  };

  // Don't render children until we've checked permission
  if (isCheckingPermission) {
    return null;
  }

  return (
    <>
      {children}
      <PermissionRequest
        visible={showPermissionModal}
        onClose={handleClosePermissionModal}
        isDark={isDark}
      />
    </>
  );
}
