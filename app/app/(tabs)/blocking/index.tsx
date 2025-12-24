import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import {
  Plus,
  Calendar,
  CalendarDays,
  Timer,
  Shield,
  ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useBlocking } from "@/context/BlockingContext";
import { BlockSchedule, DailyLimit, POPULAR_APPS } from "@/lib/appBlocking";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { TimeLimitModal } from "@/components/modals/TimeLimitModal";
import * as UsageStats from "@/modules/usage-stats";
import { ThemedBackground } from "@/components/ui/ThemedBackground";

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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
      checkPermissions();
      refreshAppsCache();
    }, [refreshData, refreshAppsCache]),
  );

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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              {t("blocking.title")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                marginTop: 4,
              }}
            >
              {schedules.length} {t("blocking.schedules").toLowerCase()} • {dailyLimits.length} {t("blocking.appLimits")?.toLowerCase() || "limits"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/scheduleCalendar")}
            activeOpacity={0.7}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0 : 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <CalendarDays size={22} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
          </TouchableOpacity>
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

        {/* Suggested Schedules */}
        <SuggestedSchedules
          schedules={schedules}
          isDark={isDark}
          onSelectTemplate={handleSuggestedSchedule}
        />

        {/* Schedules Section */}
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

          {dailyLimits.length === 0 ? (
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
            dailyLimits.map((limit) => (
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

      {/* Floating Action Button - New Schedule */}
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
