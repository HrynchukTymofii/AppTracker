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
import { useTranslation } from 'react-i18next';
import { useBlocking } from "@/context/BlockingContext";
import { POPULAR_APPS } from "@/lib/appBlocking";
import * as UsageStats from "@/modules/usage-stats";
import type { InstalledApp } from "@/modules/usage-stats";
import {
  Target,
  Clock,
  ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// Import extracted components
import {
  POPULAR_APP_KEYWORDS,
  CircularTimer,
  DetoxSettingsModal,
} from "@/components/detox";

export default function DetoxScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { focusSession, startFocus, endFocus, refreshData } = useBlocking();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
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

  // Calculate remaining time for focus session
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(0);

  // Update focus session timer every second
  useEffect(() => {
    if (!focusSession) {
      setFocusTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const endTime = focusSession.startTime + focusSession.durationMinutes * 60 * 1000;
      const remaining = Math.max(0, endTime - Date.now());
      setFocusTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [focusSession]);

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
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              {t('focusMode.title')}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                marginTop: 4,
              }}
            >
              {t('focusMode.subtitle')}
            </Text>
          </View>

          {/* Timer Section */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 32,
              marginBottom: 32,
              alignItems: "center",
            }}
          >
            <CircularTimer
              size={280}
              strokeWidth={16}
              timeRemaining={focusSession ? Math.floor(focusTimeRemaining / 1000) : detoxDuration * 60}
              totalTime={focusSession ? focusSession.durationMinutes * 60 : detoxDuration * 60}
              isDark={isDark}
            />
          </View>

          {/* Start/End Focus Button */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            {focusSession ? (
              <TouchableOpacity
                onPress={() => endFocus()}
                activeOpacity={0.8}
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  shadowColor: "#ef4444",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <LinearGradient
                  colors={["#ef4444", "#dc2626"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 20,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 12,
                  }}
                >
                  <Target size={26} color="#ffffff" strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#ffffff',
                    }}
                  >
                    {t('focusMode.endSession')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (detoxApps.length === 0) {
                    showErrorToast(t('common.error'), t('blocking.alerts.selectAtLeastOneAppToBlock'));
                    return;
                  }
                  startFocus(detoxDuration, detoxApps, false);
                }}
                activeOpacity={0.8}
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  shadowColor: "#10b981",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <LinearGradient
                  colors={["#10b981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 20,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 12,
                  }}
                >
                  <Target size={26} color="#ffffff" strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#ffffff',
                    }}
                  >
                    {t('focusMode.startSession')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Duration Card */}
          <View style={{ paddingHorizontal: 20 }}>
            <TouchableOpacity
              onPress={() => setShowSettingsModal(true)}
              activeOpacity={0.7}
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#3b82f6", "#2563eb"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <Clock size={24} color="#ffffff" strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#0f172a",
                  }}
                >
                  {t('focusMode.duration')}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                    marginTop: 2,
                  }}
                >
                  {t('focusMode.minutes', { count: detoxDuration })}
                </Text>
              </View>
              <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"} />
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <View
              style={{
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(16, 185, 129, 0.2)",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#10b981",
                  marginBottom: 8,
                }}
              >
                {t('focusMode.whyTitle')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "rgba(255,255,255,0.6)" : "#64748b",
                  lineHeight: 20,
                }}
              >
                {t('focusMode.whyDescription')}
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
      </SafeAreaView>
    </ThemedBackground>
  );
}
