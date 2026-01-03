import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Share,
} from "react-native";
import {
  Plus,
  Calendar,
  CalendarDays,
  Timer,
  Shield,
  ChevronRight,
  Target,
  Clock,
  Dumbbell,
  Share2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useBlocking } from "@/context/BlockingContext";
import { useEarnedTime } from "@/context/EarnedTimeContext";
import { BlockSchedule, DailyLimit, POPULAR_APPS } from "@/lib/appBlocking";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { TimeLimitModal } from "@/components/modals/TimeLimitModal";
import * as UsageStats from "@/modules/usage-stats";
import { ThemedBackground } from "@/components/ui/ThemedBackground";
import { getWeekUsage, formatDate, getWeekDateRange } from "@/lib/usageDatabase";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

// Import extracted components
import {
  AppSelectionModal,
  ScheduleModal,
  ScheduleCard,
  AppLimitCard,
  PermissionBanner,
  SuggestedSchedules,
  APPS_CACHE_KEY,
  APPS_CACHE_TIME_KEY,
  CACHE_DURATION,
  SuggestedScheduleTemplate,
} from "@/components/blocking";

// Circular Progress Component for Total Daily Goal
const CircularProgress = ({
  progress,
  size,
  strokeWidth,
  isDark,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  isDark: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#10b981" />
            <Stop offset="100%" stopColor="#059669" />
          </SvgLinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
    </View>
  );
};

export default function BlockingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ openSchedule?: string; openLimits?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    schedules,
    dailyLimits,
    addSchedule,
    editSchedule,
    removeSchedule,
    setAppDailyLimit,
    removeAppDailyLimit,
    refreshData,
    isAccessibilityServiceEnabled,
    openAccessibilitySettings,
    hasOverlayPermission,
    openOverlaySettings,
  } = useBlocking();

  const {
    totalDailyLimit,
    setTotalDailyLimit,
  } = useEarnedTime();

  const [showTotalLimitOptions, setShowTotalLimitOptions] = useState(false);

  // Real device usage stats
  const [todayUsage, setTodayUsage] = useState(0); // in minutes
  const [weeklyUsage, setWeeklyUsage] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]); // last 7 days in minutes
  const [appUsageMap, setAppUsageMap] = useState<Record<string, number>>({}); // packageName -> minutes used today

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAppSelection, setShowAppSelection] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editingLimit, setEditingLimit] = useState<DailyLimit | null>(null);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [showLimitDeleteConfirm, setShowLimitDeleteConfirm] = useState(false);
  const [limitToDelete, setLimitToDelete] = useState<DailyLimit | null>(null);
  const [pendingNewApps, setPendingNewApps] = useState<string[]>([]);
  const [showNewAppsLimitModal, setShowNewAppsLimitModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BlockSchedule | null>(null);
  const [scheduleInitialValues, setScheduleInitialValues] = useState<{
    name?: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
  } | null>(null);

  // Open schedule modal if navigated with openSchedule param
  useEffect(() => {
    if (params.openSchedule === "true") {
      setShowScheduleModal(true);
      router.setParams({ openSchedule: undefined });
    }
  }, [params.openSchedule]);

  // Open app selection modal if navigated with openLimits param
  useEffect(() => {
    if (params.openLimits === "true") {
      setShowAppSelection(true);
      router.setParams({ openLimits: undefined });
    }
  }, [params.openLimits]);

  // Refresh installed apps cache in background
  const refreshAppsCache = useCallback(async () => {
    try {
      const cacheTime = await AsyncStorage.getItem(APPS_CACHE_TIME_KEY);
      const isCacheFresh = cacheTime &&
        Date.now() - parseInt(cacheTime) < CACHE_DURATION;

      if (!isCacheFresh) {
        const apps = await UsageStats.getInstalledApps();
        const cacheData = apps.map((app) => ({
          packageName: app.packageName,
          appName: app.appName,
        }));
        await AsyncStorage.setItem(APPS_CACHE_KEY, JSON.stringify(cacheData));
        await AsyncStorage.setItem(APPS_CACHE_TIME_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error("Error refreshing apps cache:", error);
    }
  }, []);

  // Fetch real usage stats from device
  const fetchUsageStats = useCallback(async () => {
    try {
      // Get blocked app package names
      const blockedPackages = dailyLimits.map(l => l.packageName);

      if (blockedPackages.length === 0) {
        setTodayUsage(0);
        setWeeklyUsage([0, 0, 0, 0, 0, 0, 0]);
        setAppUsageMap({});
        return;
      }

      // Get today's usage for blocked apps only
      const todayStats = await UsageStats.getTodayUsageStats();
      if (todayStats.hasPermission && todayStats.apps) {
        // Build per-app usage map
        const usageMap: Record<string, number> = {};
        let totalBlockedUsage = 0;

        todayStats.apps.forEach(app => {
          if (blockedPackages.includes(app.packageName)) {
            const minutes = Math.round(app.timeInForeground / (1000 * 60));
            usageMap[app.packageName] = minutes;
            totalBlockedUsage += app.timeInForeground;
          }
        });

        setAppUsageMap(usageMap);
        setTodayUsage(Math.round(totalBlockedUsage / (1000 * 60)));
      }

      // Get weekly usage - fetch last 7 days
      const weekData: number[] = [];
      const today = new Date();

      // Also try to get data from local database as fallback
      const { startDate, endDate } = getWeekDateRange(0);
      const dbWeekData = await getWeekUsage(startDate, endDate);
      const dbDataMap = new Map(dbWeekData.map(d => [d.date, d]));

      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(today);
        dayStart.setDate(today.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dateStr = formatDate(dayStart);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayStats = await UsageStats.getUsageStats(dayStart.getTime(), dayEnd.getTime());
        if (dayStats.hasPermission && dayStats.apps) {
          const blockedDayUsage = dayStats.apps
            .filter(app => blockedPackages.includes(app.packageName))
            .reduce((sum, app) => sum + app.timeInForeground, 0);

          if (blockedDayUsage > 0) {
            weekData.push(Math.round(blockedDayUsage / (1000 * 60))); // minutes
          } else {
            // Try database fallback for this day
            const dbDay = dbDataMap.get(dateStr);
            if (dbDay && dbDay.total_screen_time > 0) {
              weekData.push(Math.round(dbDay.total_screen_time / (1000 * 60)));
            } else {
              weekData.push(0);
            }
          }
        } else {
          // Try database fallback
          const dbDay = dbDataMap.get(dateStr);
          if (dbDay && dbDay.total_screen_time > 0) {
            weekData.push(Math.round(dbDay.total_screen_time / (1000 * 60)));
          } else {
            weekData.push(0);
          }
        }
      }
      setWeeklyUsage(weekData);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  }, [dailyLimits]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
      checkPermissions();
      refreshAppsCache();
      fetchUsageStats();
    }, [refreshData, refreshAppsCache, fetchUsageStats]),
  );

  // Refresh usage stats whenever daily limits change (new apps added/removed)
  useEffect(() => {
    fetchUsageStats();
  }, [dailyLimits.length]);

  // Computed values for the card
  const remainingLimit = useMemo(() => Math.max(0, totalDailyLimit - todayUsage), [totalDailyLimit, todayUsage]);
  const usagePercent = useMemo(() => Math.min(100, Math.round((todayUsage / totalDailyLimit) * 100)), [todayUsage, totalDailyLimit]);

  // Enhanced daily limits with real usage from device
  const enhancedDailyLimits = useMemo(() => {
    return dailyLimits.map(limit => ({
      ...limit,
      usedMinutes: appUsageMap[limit.packageName] || 0,
    }));
  }, [dailyLimits, appUsageMap]);

  // Check permissions on mount and when app comes to foreground
  useEffect(() => {
    checkPermissions();
    const interval = setInterval(checkPermissions, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkPermissions = async () => {
    const [accessibility, overlay] = await Promise.all([
      isAccessibilityServiceEnabled(),
      hasOverlayPermission(),
    ]);
    setAccessibilityEnabled(accessibility);
    setOverlayEnabled(overlay);
  };

  // Handle schedule creation/edit and refresh
  const handleSaveSchedule = async (
    schedule: Omit<BlockSchedule, "id" | "createdAt">,
  ) => {
    if (editingSchedule) {
      await editSchedule(editingSchedule.id, schedule);
    } else {
      await addSchedule(schedule);
    }
    await refreshData();
    setEditingSchedule(null);
    setScheduleInitialValues(null);
  };

  // Open schedule modal for creating from template
  const handleSuggestedSchedule = (template: SuggestedScheduleTemplate) => {
    setScheduleInitialValues({
      name: t(template.nameKey) || template.defaultName,
      startTime: template.startTime,
      endTime: template.endTime,
      daysOfWeek: template.daysOfWeek,
    });
    setEditingSchedule(null);
    setShowScheduleModal(true);
  };

  // Open schedule modal for editing existing schedule
  const handleEditSchedule = (schedule: BlockSchedule) => {
    setEditingSchedule(schedule);
    setScheduleInitialValues(null);
    setShowScheduleModal(true);
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
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
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
            Goals
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
              marginTop: 4,
            }}
          >
            Set your daily screen time limits
          </Text>
        </View>

        {/* Permission Warning Banner */}
        {Platform.OS === "android" && (
          <PermissionBanner
            accessibilityEnabled={accessibilityEnabled}
            overlayEnabled={overlayEnabled}
            onAccessibilityPress={openAccessibilitySettings}
            onOverlayPress={openOverlaySettings}
          />
        )}

        {/* Today's Progress Card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0 : 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {/* Header Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  TODAY'S PROGRESS
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTotalLimitOptions(!showTotalLimitOptions)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "800",
                      color: isDark ? "#ffffff" : "#0f172a",
                    }}
                  >
                    {totalDailyLimit >= 60
                      ? `${Math.floor(totalDailyLimit / 60)}h`
                      : `${totalDailyLimit}m`}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "500",
                        color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                      }}
                    >
                      {" "}goal
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const usedFormatted = todayUsage >= 60
                      ? `${Math.floor(todayUsage / 60)}h ${todayUsage % 60}m`
                      : `${todayUsage}m`;
                    const remainingFormatted = remainingLimit >= 60
                      ? `${Math.floor(remainingLimit / 60)}h ${remainingLimit % 60}m`
                      : `${remainingLimit}m`;
                    const goalFormatted = totalDailyLimit >= 60
                      ? `${Math.floor(totalDailyLimit / 60)}h`
                      : `${totalDailyLimit}m`;

                    const message = `📱 My Screen Time Today\n\n` +
                      `🎯 Goal: ${goalFormatted}\n` +
                      `⏱️ Used: ${usedFormatted}\n` +
                      `✅ Remaining: ${remainingFormatted}\n` +
                      `📊 Progress: ${usagePercent}%\n\n` +
                      `Taking control of my screen time with LockIn! 💪`;

                    await Share.share({
                      message,
                      title: "My Screen Time Progress",
                    });
                  } catch (error) {
                    console.error('Error sharing:', error);
                  }
                }}
                activeOpacity={0.7}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Share2 size={18} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {/* Progress Section */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              {/* Circular Progress with Time Left */}
              <View style={{ position: "relative", marginRight: 24 }}>
                <CircularProgress
                  progress={usagePercent}
                  size={100}
                  strokeWidth={8}
                  isDark={isDark}
                />
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: "#10b981",
                    }}
                  >
                    {remainingLimit >= 60
                      ? `${Math.floor(remainingLimit / 60)}h`
                      : `${remainingLimit}m`}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                      fontWeight: "500",
                    }}
                  >
                    left
                  </Text>
                </View>
              </View>

              {/* Weekly Bar Chart */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                    marginBottom: 12,
                  }}
                >
                  This Week
                </Text>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
                  {(() => {
                    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                    const today = new Date().getDay();
                    // Get day labels for last 7 days ending with today
                    const orderedDays = [];
                    for (let i = 6; i >= 0; i--) {
                      const d = new Date();
                      d.setDate(d.getDate() - i);
                      orderedDays.push(days[d.getDay()]);
                    }

                    // weeklyUsage is already in order [6 days ago, ..., today]
                    const maxUsage = Math.max(...weeklyUsage, totalDailyLimit);

                    return orderedDays.map((day, idx) => {
                      const usage = weeklyUsage[idx] || 0;
                      const heightPercent = maxUsage > 0 ? (usage / maxUsage) * 100 : 0;
                      const isToday = idx === 6;

                      return (
                        <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                          <View
                            style={{
                              width: "100%",
                              height: 50,
                              justifyContent: "flex-end",
                            }}
                          >
                            <View
                              style={{
                                width: "100%",
                                height: Math.max(heightPercent * 0.5, 4),
                                backgroundColor: isToday
                                  ? "#10b981"
                                  : isDark
                                  ? "rgba(255, 255, 255, 0.2)"
                                  : "#d1d5db",
                                borderRadius: 3,
                              }}
                            />
                          </View>
                          <Text
                            style={{
                              fontSize: 10,
                              color: isToday ? "#10b981" : (isDark ? "rgba(255,255,255,0.5)" : "#9ca3af"),
                              marginTop: 6,
                              fontWeight: isToday ? "700" : "500",
                            }}
                          >
                            {day}
                          </Text>
                        </View>
                      );
                    });
                  })()}
                </View>
              </View>
            </View>

            {/* Bottom Stats Row */}
            <View
              style={{
                flexDirection: "row",
                borderTopWidth: 1,
                borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                paddingTop: 16,
              }}
            >
              {/* Used */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#10b981",
                  }}
                >
                  {todayUsage >= 60
                    ? `${Math.floor(todayUsage / 60)}h${todayUsage % 60}m`
                    : `${todayUsage}m`}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                    marginTop: 2,
                  }}
                >
                  Used
                </Text>
              </View>

              {/* Divider */}
              <View
                style={{
                  width: 1,
                  backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                }}
              />

              {/* Remaining */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: isDark ? "#ffffff" : "#0f172a",
                  }}
                >
                  {remainingLimit >= 60
                    ? `${Math.floor(remainingLimit / 60)}h${remainingLimit % 60}m`
                    : `${remainingLimit}m`}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                    marginTop: 2,
                  }}
                >
                  Remaining
                </Text>
              </View>

              {/* Divider */}
              <View
                style={{
                  width: 1,
                  backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                }}
              />

              {/* Percentage of goal */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: isDark ? "#ffffff" : "#0f172a",
                  }}
                >
                  {usagePercent}%
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                    marginTop: 2,
                  }}
                >
                  Of goal
                </Text>
              </View>
            </View>

            {/* Total Limit Options */}
            {showTotalLimitOptions && (
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                    marginBottom: 12,
                  }}
                >
                  Set daily goal:
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {[30, 60, 90, 120, 180, 240].map((mins) => {
                    const isSelected = totalDailyLimit === mins;
                    const label = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
                    return (
                      <TouchableOpacity
                        key={mins}
                        onPress={() => {
                          setTotalDailyLimit(mins);
                          setShowTotalLimitOptions(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 18,
                          borderRadius: 10,
                          backgroundColor: isSelected
                            ? "#10b981"
                            : isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "#f3f4f6",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: isSelected ? "#ffffff" : isDark ? "#ffffff" : "#374151",
                          }}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Warning if limit reached */}
            {remainingLimit <= 0 && (
              <View
                style={{
                  marginTop: 16,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  padding: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Shield size={18} color="#ef4444" />
                <Text
                  style={{
                    fontSize: 13,
                    color: "#ef4444",
                    fontWeight: "600",
                    marginLeft: 10,
                    flex: 1,
                  }}
                >
                  Daily limit reached! All apps are blocked.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* SCHEDULES COMMENTED OUT - App now uses earned time model
        <SuggestedSchedules
          schedules={schedules}
          isDark={isDark}
          onSelectTemplate={handleSuggestedSchedule}
        />

        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={isDark ? ["#3b82f6", "#1d4ed8"] : ["#3b82f6", "#2563eb"]}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <Calendar size={16} color="#ffffff" strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#0f172a",
                  letterSpacing: -0.3,
                }}
              >
                {t("blocking.schedules")}
              </Text>
            </View>
          </View>

          {schedules.length === 0 ? (
            <View
              style={{
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.03)"
                  : "#ffffff",
                borderRadius: 20,
                padding: 32,
                alignItems: "center",
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0 : 0.03,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Calendar size={28} color="#3b82f6" strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDark ? "#ffffff" : "#0f172a",
                  marginBottom: 6,
                }}
              >
                {t("blocking.noSchedulesYet")}
              </Text>
              <Text
                style={{
                  color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                  textAlign: "center",
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {t("blocking.createScheduleHint")}
              </Text>
            </View>
          ) : (
            schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                isDark={isDark}
                onPress={() => handleEditSchedule(schedule)}
                onLongPress={() => {
                  setScheduleToDelete(schedule.id);
                  setShowDeleteConfirm(true);
                }}
              />
            ))
          )}
        </View>
        END SCHEDULES SECTION */}

        {/* App Limits Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={isDark ? ["#f59e0b", "#d97706"] : ["#f59e0b", "#ea580c"]}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <Timer size={16} color="#ffffff" strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#0f172a",
                  letterSpacing: -0.3,
                }}
              >
                {t("blocking.appLimits") || "App Limits"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAppSelection(true)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#ffffff",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <Plus size={16} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={2} />
              <Text
                style={{
                  marginLeft: 6,
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {t("common.add")}
              </Text>
            </TouchableOpacity>
          </View>

          {enhancedDailyLimits.length === 0 ? (
            <View
              style={{
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.03)"
                  : "#ffffff",
                borderRadius: 20,
                padding: 32,
                alignItems: "center",
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0 : 0.03,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Timer size={28} color="#f59e0b" strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDark ? "#ffffff" : "#0f172a",
                  marginBottom: 6,
                }}
              >
                {t("blocking.noLimitsSet") || "No app limits set"}
              </Text>
              <Text
                style={{
                  color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                  textAlign: "center",
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {t("blocking.addLimitsHint") || "Add apps to set daily usage limits"}
              </Text>
            </View>
          ) : (
            enhancedDailyLimits.map((limit) => (
              <AppLimitCard
                key={limit.packageName}
                limit={limit}
                isDark={isDark}
                onPress={() => {
                  setEditingLimit(limit);
                  setShowLimitModal(true);
                }}
                onLongPress={() => {
                  setLimitToDelete(limit);
                  setShowLimitDeleteConfirm(true);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {/* SCHEDULE MODAL COMMENTED OUT
      <ScheduleModal
        visible={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setEditingSchedule(null);
          setScheduleInitialValues(null);
        }}
        onSave={handleSaveSchedule}
        isDark={isDark}
        editSchedule={editingSchedule}
        initialValues={scheduleInitialValues || undefined}
        existingSchedules={schedules}
      />
      */}

      <AppSelectionModal
        visible={showAppSelection}
        onClose={() => setShowAppSelection(false)}
        onSelect={(apps) => {
          const newApps = apps.filter(
            (pkg) => !dailyLimits.some((l) => l.packageName === pkg)
          );
          if (newApps.length > 0) {
            setPendingNewApps(newApps);
            setShowNewAppsLimitModal(true);
          }
        }}
        selectedApps={dailyLimits.map((l) => l.packageName)}
        isDark={isDark}
      />

      {/* Edit Limit Modal */}
      <TimeLimitModal
        visible={showLimitModal}
        appName={editingLimit?.appName}
        initialMinutes={editingLimit?.limitMinutes || 30}
        onConfirm={async (totalMinutes) => {
          if (editingLimit) {
            await setAppDailyLimit(editingLimit.packageName, editingLimit.appName, totalMinutes);
          }
          setShowLimitModal(false);
          setEditingLimit(null);
        }}
        onCancel={() => {
          setShowLimitModal(false);
          setEditingLimit(null);
        }}
      />

      {/* Add New Apps Limit Modal */}
      <TimeLimitModal
        visible={showNewAppsLimitModal}
        appName={
          pendingNewApps.length === 1
            ? POPULAR_APPS.find((a) => a.packageName === pendingNewApps[0])?.appName || pendingNewApps[0]
            : `${pendingNewApps.length} ${t("blocking.apps") || "apps"}`
        }
        initialMinutes={30}
        onConfirm={async (totalMinutes) => {
          for (const packageName of pendingNewApps) {
            const appInfo = POPULAR_APPS.find((a) => a.packageName === packageName);
            const appName = appInfo?.appName || packageName.split(".").pop() || packageName;
            await setAppDailyLimit(packageName, appName, totalMinutes);
          }
          setShowNewAppsLimitModal(false);
          setPendingNewApps([]);
        }}
        onCancel={() => {
          setShowNewAppsLimitModal(false);
          setPendingNewApps([]);
        }}
      />

      {/* FLOATING ACTION BUTTON COMMENTED OUT - Schedule feature disabled
      <TouchableOpacity
        onPress={() => setShowScheduleModal(true)}
        activeOpacity={0.9}
        style={{
          position: "absolute",
          bottom: 140,
          right: 20,
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
          paddingHorizontal: 22,
          borderRadius: 20,
          shadowColor: "#3b82f6",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 10,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={["#3b82f6", "#1d4ed8"]}
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
        <Plus size={20} color="#ffffff" strokeWidth={2.5} />
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#ffffff",
            marginLeft: 8,
            letterSpacing: 0.3,
          }}
        >
          {t("blocking.newSchedule")}
        </Text>
      </TouchableOpacity>
      */}

      {/* Delete Schedule Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title={t("blocking.alerts.deleteSchedule")}
        message={t("blocking.alerts.deleteScheduleConfirm")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        type="danger"
        onConfirm={() => {
          if (scheduleToDelete) {
            removeSchedule(scheduleToDelete);
          }
          setShowDeleteConfirm(false);
          setScheduleToDelete(null);
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setScheduleToDelete(null);
        }}
      />

      {/* Delete Daily Limit Confirmation Modal */}
      <ConfirmationModal
        visible={showLimitDeleteConfirm}
        title={t("blocking.alerts.removeLimit") || "Remove Limit"}
        message={t("blocking.alerts.removeLimitConfirm") || `Remove daily limit for ${limitToDelete?.appName}?`}
        confirmText={t("common.delete") || "Remove"}
        cancelText={t("common.cancel")}
        type="danger"
        onConfirm={() => {
          if (limitToDelete) {
            removeAppDailyLimit(limitToDelete.packageName);
          }
          setShowLimitDeleteConfirm(false);
          setLimitToDelete(null);
        }}
        onCancel={() => {
          setShowLimitDeleteConfirm(false);
          setLimitToDelete(null);
        }}
      />
      </SafeAreaView>
    </ThemedBackground>
  );
}
