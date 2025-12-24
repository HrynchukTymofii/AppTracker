import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { showErrorToast } from "@/components/ui/CustomToast";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedBackground } from "@/components/ui/ThemedBackground";
import { useFocusEffect } from "expo-router";
import { useDetox } from "@/context/DetoxContext";
import { useTranslation } from 'react-i18next';
import { useBlocking } from "@/context/BlockingContext";
import { POPULAR_APPS } from "@/lib/appBlocking";
import * as UsageStats from "@/modules/usage-stats";
import type { InstalledApp } from "@/modules/usage-stats";
import {
  Lock,
  Target,
  Settings,
  Camera,
} from "lucide-react-native";
import { TaskVerificationModal } from "@/components/modals/TaskVerificationModal";

// Import extracted components
import {
  POPULAR_APP_KEYWORDS,
  CircularTimer,
  DetoxSettingsModal,
  FocusModal,
} from "@/components/detox";

export default function DetoxScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isActive, timeRemaining, startDetox, TOTAL_TIME } = useDetox();
  const { focusSession, startFocus, endFocus, refreshData } = useBlocking();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showTaskVerification, setShowTaskVerification] = useState(false);
  const [detoxDuration, setDetoxDuration] = useState(30); // Default 30 minutes
  const [detoxApps, setDetoxApps] = useState<string[]>([]); // Will be populated with installed time wasters
  const [appsLoaded, setAppsLoaded] = useState(false);

  // Load default time waster apps from installed apps
  useEffect(() => {
    const loadDefaultApps = async () => {
      if (appsLoaded) return;
      try {
        const apps = await UsageStats.getInstalledApps();

        // Find installed time waster apps
        const isPopularApp = (app: InstalledApp): number => {
          const packageLower = app.packageName.toLowerCase();
          const nameLower = app.appName.toLowerCase();
          for (let i = 0; i < POPULAR_APP_KEYWORDS.length; i++) {
            const keyword = POPULAR_APP_KEYWORDS[i];
            if (packageLower.includes(keyword) || nameLower.includes(keyword)) {
              return i;
            }
          }
          return -1;
        };

        const popularWithIndex = apps
          .map((app) => ({ app, index: isPopularApp(app) }))
          .filter(({ index }) => index >= 0);

        popularWithIndex.sort((a, b) => a.index - b.index);
        const defaultApps = popularWithIndex.slice(0, 15).map(({ app }) => app.packageName);

        setDetoxApps(defaultApps);
        setAppsLoaded(true);
      } catch (error) {
        console.error("Error loading default apps:", error);
        // Fallback to hardcoded popular app package names
        setDetoxApps(POPULAR_APPS.map(app => app.packageName).slice(0, 15));
        setAppsLoaded(true);
      }
    };

    loadDefaultApps();
  }, [appsLoaded]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const handleEndFocus = async () => {
    if (focusSession?.requiresTaskCompletion) {
      // Show the task verification chat modal
      setShowTaskVerification(true);
    } else {
      await endFocus();
    }
  };

  const handleTaskVerified = async () => {
    setShowTaskVerification(false);
    await endFocus();
    await refreshData();
  };

  const handleForceUnlock = async () => {
    setShowTaskVerification(false);
    await endFocus(); // End without verification
    await refreshData();
  };

  // Calculate remaining time for focus session
  const getFocusTimeRemaining = () => {
    if (!focusSession) return null;
    const endTime = focusSession.startTime + focusSession.durationMinutes * 60 * 1000;
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <View style={{ width: 40 }} />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            {t('detox.title')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowSettingsModal(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={22} color={isDark ? "#ffffff" : "#111827"} />
          </TouchableOpacity>
        </View>


        {/* Active Focus Session Banner */}
        {focusSession && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: '#ef4444',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Lock size={24} color="#ffffff" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#ffffff',
                }}
              >
                {t('blocking.focusSessionActive')}
              </Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>
              {focusSession.blockedApps.length} apps blocked •{' '}
              {focusSession.requiresTaskCompletion
                ? t('blocking.taskRequiredToUnlock')
                : `${getFocusTimeRemaining()} ${t('blocking.timeRemaining')}`}
            </Text>
            <TouchableOpacity
              onPress={handleEndFocus}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                {focusSession.requiresTaskCompletion ? t('blocking.completeTaskUnlock') : t('blocking.endSession')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timer Section */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 32,
            alignItems: "center",
          }}
        >

          <CircularTimer
            size={280}
            strokeWidth={12}
            timeRemaining={timeRemaining}
            totalTime={TOTAL_TIME}
            isDark={isDark}
          />

          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
              marginTop: 24,
              textAlign: "center",
            }}
          >
            {isActive
              ? "Click the Detox button to stop the timer"
              : "Click the Detox button to start the timer"
            }
          </Text>
        </View>

        {/* Start Focus Buttons */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24, gap: 12 }}>
          {/* Quick Focus Button */}
          <TouchableOpacity
            onPress={() => {
              if (detoxApps.length === 0) {
                showErrorToast(t('common.error'), t('blocking.alerts.selectAtLeastOneAppToBlock'));
                return;
              }
              startFocus(detoxDuration, detoxApps, false);
            }}
            disabled={!!focusSession}
            style={{
              backgroundColor: focusSession
                ? isDark
                  ? '#374151'
                  : '#e5e7eb'
                : '#ef4444',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Target size={28} color={focusSession ? '#9ca3af' : '#ffffff'} />
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: focusSession ? '#9ca3af' : '#ffffff',
                }}
              >
                {t('blocking.startFocus')}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: focusSession ? '#9ca3af' : 'rgba(255, 255, 255, 0.8)',
                  marginTop: 2,
                }}
              >
                {detoxDuration}m • {detoxApps.length} apps
              </Text>
            </View>
          </TouchableOpacity>

          {/* Focus with Task Button */}
          <TouchableOpacity
            onPress={() => setShowFocusModal(true)}
            disabled={!!focusSession}
            style={{
              backgroundColor: focusSession
                ? isDark
                  ? '#374151'
                  : '#e5e7eb'
                : isDark
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(59, 130, 246, 0.1)',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 1.5,
              borderColor: focusSession
                ? 'transparent'
                : '#3b82f6',
            }}
          >
            <Camera size={22} color={focusSession ? '#9ca3af' : '#3b82f6'} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: focusSession ? '#9ca3af' : '#3b82f6',
              }}
            >
              Focus with Task Verification
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 8,
              }}
            >
              About Digital Detox
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#9ca3af" : "#6b7280",
                lineHeight: 20,
              }}
            >
              Take a break from your phone and improve your mental health. During detox mode, you'll be encouraged to stay away from distracting apps.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <DetoxSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        duration={detoxDuration}
        setDuration={setDetoxDuration}
        selectedApps={detoxApps}
        setSelectedApps={setDetoxApps}
        isDark={isDark}
      />

      {/* Focus with Task Modal */}
      <FocusModal
        visible={showFocusModal}
        onClose={() => setShowFocusModal(false)}
        onStart={(duration, apps, requiresTask, beforePhoto, taskDescription) => {
          startFocus(duration, apps, requiresTask, beforePhoto, taskDescription);
          setShowFocusModal(false);
        }}
        isDark={isDark}
      />

      {/* Task Verification Chat Modal */}
      {focusSession?.requiresTaskCompletion && focusSession?.beforePhotoUri && (
        <TaskVerificationModal
          visible={showTaskVerification}
          taskDescription={
            focusSession.taskDescription || 'Complete your task'
          }
          beforePhotoUri={focusSession.beforePhotoUri}
          onClose={() => setShowTaskVerification(false)}
          onVerified={handleTaskVerified}
          onForceUnlock={handleForceUnlock}
        />
      )}
      </SafeAreaView>
    </ThemedBackground>
  );
}
