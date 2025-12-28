import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Animated,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  HelpCircle,
  Lock,
  Shield,
  Calendar,
  Clock,
  ChevronRight,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Timer,
  X,
  Plus,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  getTodayUsageStats,
  formatDuration,
  calculateHealthScore,
  getOrbLevel,
  initializeTracking,
  getDailyUsageForWeek,
} from "@/lib/usageTracking";
import { useBlocking } from "@/context/BlockingContext";
import { useTheme } from "@/context/ThemeContext";
import { getWeekUsage, formatDate } from "@/lib/usageDatabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAchievementStats } from "@/lib/achievementTracking";
import AnimatedOrb from "@/components/AnimatedOrb";
import { HelpCarousel } from "@/components/modals/HelpCarousel";
import { homeHelpCards } from "@/lib/helpContent";
import { ThemedBackground } from "@/components/ui/ThemedBackground";
import { WalletBalanceCard } from "@/components/WalletBalanceCard";

const PLANET_SIZE = 160;

export default function HomeScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [healthScore, setHealthScore] = useState(75);
  const [totalScreenTime, setTotalScreenTime] = useState(0);
  const [pickups, setPickups] = useState(0);
  const [orbLevel, setOrbLevel] = useState(3);
  const [previousOrbLevel, setPreviousOrbLevel] = useState(3);
  const [streak, setStreak] = useState(0);
  const [averageScreenTime, setAverageScreenTime] = useState(0);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [appsUsage, setAppsUsage] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [showHelpCarousel, setShowHelpCarousel] = useState(false);

  // Animation values
  const planetTransition = useRef(new Animated.Value(0)).current;
  const planetScale = useRef(new Animated.Value(1)).current;
  const planetOpacity = useRef(new Animated.Value(1)).current;

  const icon1Anim = useState(new Animated.Value(0))[0];
  const icon2Anim = useState(new Animated.Value(0))[0];
  const icon3Anim = useState(new Animated.Value(0))[0];
  const icon4Anim = useState(new Animated.Value(0))[0];
  const icon5Anim = useState(new Animated.Value(0))[0];

  const text1Anim = useState(new Animated.Value(0))[0];
  const text2Anim = useState(new Animated.Value(0))[0];
  const text3Anim = useState(new Animated.Value(0))[0];
  const text4Anim = useState(new Animated.Value(0))[0];
  const text5Anim = useState(new Animated.Value(0))[0];

  const { focusSession, schedules, blockedApps } = useBlocking();
  const { accentColor } = useTheme();

  // Animate planet change
  useEffect(() => {
    if (orbLevel !== previousOrbLevel) {
      // Animate out
      Animated.parallel([
        Animated.timing(planetScale, {
          toValue: 0.8,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(planetOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPreviousOrbLevel(orbLevel);
        // Animate in
        Animated.parallel([
          Animated.spring(planetScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(planetOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [orbLevel, previousOrbLevel]);

  // Toggle menu animation with staggered close
  const toggleMenu = () => {
    if (quickMenuOpen) {
      // Staggered close animation (reverse order)
      Animated.stagger(50, [
        Animated.parallel([
          Animated.timing(text1Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(icon1Anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(text2Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(icon2Anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(text3Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(icon3Anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(text4Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(icon4Anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start(() => setQuickMenuOpen(false));
    } else {
      setQuickMenuOpen(true);
      // Staggered open animation
      Animated.stagger(60, [
        Animated.parallel([
          Animated.spring(icon4Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(text4Anim, { toValue: 1, duration: 200, delay: 50, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(icon3Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(text3Anim, { toValue: 1, duration: 200, delay: 50, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(icon2Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(text2Anim, { toValue: 1, duration: 200, delay: 50, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(icon1Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(text1Anim, { toValue: 1, duration: 200, delay: 50, useNativeDriver: true }),
        ]),
      ]).start();
    }
  };

  // Load streak from achievement stats
  const loadStreak = async () => {
    try {
      const stats = await getAchievementStats();
      setStreak(stats.currentStreak || 0);
    } catch (error) {
      console.error("Error loading streak:", error);
      setStreak(0);
    }
  };

  // Load weekly average using same data source as stats page
  const loadWeeklyAverage = async () => {
    try {
      // Use native module data for consistency with stats page
      const dailyStats = await getDailyUsageForWeek(0);
      const daysWithData = dailyStats.filter(d => d.hours > 0);

      if (daysWithData.length > 0) {
        const totalHours = daysWithData.reduce((sum, d) => sum + d.hours, 0);
        const avgHours = totalHours / daysWithData.length;
        // Convert hours to milliseconds for consistency
        setAverageScreenTime(Math.round(avgHours * 60 * 60 * 1000));
      }
    } catch (error) {
      console.error("Error loading weekly average:", error);
    }
  };

  // Fetch usage data
  const fetchUsageData = useCallback(async () => {
    try {
      setIsLoadingApps(true);
      await initializeTracking();
      const stats = await getTodayUsageStats();

      const score = calculateHealthScore(stats.totalScreenTime, stats.pickups);
      setHealthScore(score);
      setTotalScreenTime(stats.totalScreenTime);
      setPickups(stats.pickups);
      setOrbLevel(getOrbLevel(score));

      // Format and set app usage data (top 6 apps)
      if (stats.apps && stats.apps.length > 0) {
        const formattedApps = stats.apps
          .sort((a, b) => b.timeInForeground - a.timeInForeground)
          .slice(0, 6)
          .map((app) => ({
            ...app,
            usageTime: app.timeInForeground, // Alias for easier use in UI
          }));
        setAppsUsage(formattedApps);
      }

      await loadStreak();
      await loadWeeklyAverage();
    } catch (error) {
      console.error("Error fetching usage data:", error);
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsageData();
    setRefreshing(false);
  }, [fetchUsageData]);

  // Check if an app is currently blocked
  const isAppBlocked = (packageName: string): boolean => {
    // Check manual blocks
    if (blockedApps.some((app) => app.packageName === packageName)) {
      return true;
    }
    // Check focus session blocks
    if (focusSession && focusSession.blockedApps.includes(packageName)) {
      return true;
    }
    return false;
  };

  // Get top 3 culprits (most used apps)
  const getTopCulprits = () => {
    return appsUsage.slice(0, 3);
  };

  // Get day name abbreviation
  const getDayName = (dayIndex: number): string => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayIndex];
  };

  // Get days label for schedule
  const getScheduleDaysLabel = (daysOfWeek: number[]): string => {
    if (daysOfWeek.length === 7) return t("blocking.everyday") || "Everyday";
    if (
      daysOfWeek.length === 5 &&
      daysOfWeek.includes(1) &&
      daysOfWeek.includes(2) &&
      daysOfWeek.includes(3) &&
      daysOfWeek.includes(4) &&
      daysOfWeek.includes(5)
    ) {
      return t("blocking.weekdays") || "Weekdays";
    }
    if (
      daysOfWeek.length === 2 &&
      daysOfWeek.includes(0) &&
      daysOfWeek.includes(6)
    ) {
      return "Weekends";
    }
    return daysOfWeek.map((d) => getDayName(d)).join(", ");
  };

  // Check if schedule is currently active
  const isScheduleActive = (schedule: any): boolean => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (!schedule.isActive || !schedule.daysOfWeek.includes(currentDay)) {
      return false;
    }

    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  // Get schedule status text (countdown with seconds for active)
  const getScheduleStatus = (schedule: any): { text: string; isActive: boolean } => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startSeconds = startH * 3600 + startM * 60;
    const endSeconds = endH * 3600 + endM * 60;

    // Check if active now
    if (schedule.daysOfWeek.includes(currentDay) && currentSeconds >= startSeconds && currentSeconds < endSeconds) {
      const remainingSeconds = endSeconds - currentSeconds;
      const hours = Math.floor(remainingSeconds / 3600);
      const mins = Math.floor((remainingSeconds % 3600) / 60);
      const secs = remainingSeconds % 60;
      if (hours > 0) {
        return { text: `Ends in ${hours}h ${mins}m ${secs}s`, isActive: true };
      }
      if (mins > 0) {
        return { text: `Ends in ${mins}m ${secs}s`, isActive: true };
      }
      return { text: `Ends in ${secs}s`, isActive: true };
    }

    // Check if starting later today
    if (schedule.daysOfWeek.includes(currentDay) && currentSeconds < startSeconds) {
      const secondsUntil = startSeconds - currentSeconds;
      const hours = Math.floor(secondsUntil / 3600);
      const mins = Math.floor((secondsUntil % 3600) / 60);
      if (hours > 0) {
        return { text: `Starting in ${hours}h ${mins > 0 ? mins + "m" : ""}`, isActive: false };
      }
      return { text: `Starting in ${mins}m`, isActive: false };
    }

    // Find next day it runs
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (schedule.daysOfWeek.includes(checkDay)) {
        if (i === 1) {
          return { text: "Starting tomorrow", isActive: false };
        }
        return { text: `Starting ${getDayName(checkDay)}`, isActive: false };
      }
    }

    return { text: "", isActive: false };
  };

  // Get upcoming schedules (next 24 hours)
  const getUpcomingSchedules = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    return schedules
      .filter((schedule) => {
        if (!schedule.isActive) return false;
        // Check if schedule is for today and hasn't ended yet
        if (schedule.daysOfWeek.includes(currentDay) && schedule.endTime > currentTime) {
          return true;
        }
        // Check if schedule is for tomorrow
        const tomorrow = (currentDay + 1) % 7;
        if (schedule.daysOfWeek.includes(tomorrow)) {
          return true;
        }
        return false;
      })
      .slice(0, 3);
  };

  // Calculate time comparison
  const getTimeComparison = () => {
    if (averageScreenTime === 0) return { isLess: true, diff: "0m" };
    const diff = totalScreenTime - averageScreenTime;
    const isLess = diff < 0;
    return {
      isLess,
      diff: formatDuration(Math.abs(diff)),
    };
  };

  const timeComparison = getTimeComparison();
  const upcomingSchedules = getUpcomingSchedules();

  // Get remaining time for focus session
  const getFocusRemainingTime = () => {
    if (!focusSession) return "";
    const endTime = focusSession.startTime + focusSession.durationMinutes * 60 * 1000;
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            {t("home.title")}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowHelpCarousel(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HelpCircle size={24} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Animated 3D Orb */}
        <View
          style={{
            height: 220,
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 20,
          }}
        >
          <Animated.View
            style={{
              transform: [{ scale: planetScale }],
              opacity: planetOpacity,
            }}
          >
            <AnimatedOrb size={PLANET_SIZE} level={orbLevel} />
          </Animated.View>
        </View>

        {/* Health Progress Bar - Rich Gradient */}
        <View style={{ paddingHorizontal: 40, marginBottom: 24 }}>
          <View
            style={{
              height: 12,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${healthScore}%`,
                borderRadius: 6,
                overflow: "hidden",
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 12,
              }}
            >
              <LinearGradient
                colors={
                  healthScore >= 80
                    ? ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"] // Great - Rich emerald
                    : healthScore >= 60
                    ? ["#22c55e", "#4ade80", "#86efac", "#bbf7d0"] // Good - Fresh green
                    : healthScore >= 40
                    ? ["#eab308", "#facc15", "#fde047", "#fef08a"] // Average - Golden yellow
                    : ["#f97316", "#fb923c", "#fdba74", "#fed7aa"] // Low - Orange warning
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flex: 1,
                  borderRadius: 6,
                }}
              />
              {/* Shine overlay */}
              <LinearGradient
                colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.1)", "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "50%",
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                }}
              />
            </View>
          </View>
          <Text
            style={{
              textAlign: "center",
              marginTop: 8,
              fontSize: 12,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              letterSpacing: 0.5,
            }}
          >
            {t("home.health")} • {healthScore}
          </Text>
        </View>

        {/* Quick Stats Section - 3 Equal Cards */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 24,
            flexDirection: "row",
            gap: 10,
          }}
        >
          {/* Streak Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#6b7280" : "#9ca3af",
                letterSpacing: 0.5,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {t("home.streak") || "STREAK"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 14, marginRight: 4 }}>🔥</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                {streak}
              </Text>
            </View>
          </View>

          {/* Today Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#6b7280" : "#9ca3af",
                letterSpacing: 0.5,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {t("home.today") || "TODAY"}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {formatDuration(totalScreenTime)}
            </Text>
          </View>

          {/* vs Average Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#6b7280" : "#9ca3af",
                letterSpacing: 0.5,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {t("home.vsAverage") || "VS AVG"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {timeComparison.isLess ? (
                <TrendingDown size={14} color="#10b981" style={{ marginRight: 3 }} />
              ) : (
                <TrendingUp size={14} color="#ef4444" style={{ marginRight: 3 }} />
              )}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: timeComparison.isLess ? "#10b981" : "#ef4444",
                }}
              >
                {timeComparison.isLess ? "-" : "+"}
                {timeComparison.diff}
              </Text>
            </View>
          </View>
        </View>

        {/* Screen Time Balance Card */}
        <WalletBalanceCard isDark={isDark} />

        {/* Active Focus Session or Upcoming Schedules */}
        <View style={{ paddingHorizontal: 20 }}>
          {focusSession ? (
            /* Active Focus Session Card */
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/blocking")}
              activeOpacity={0.9}
              style={{
                backgroundColor: "#ef4444",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                shadowColor: "#ef4444",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Lock size={28} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: 18,
                      marginBottom: 4,
                    }}
                  >
                    {t("home.focusModeActive")}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
                    {focusSession.blockedApps.length} {t("home.appsBlocked")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 28,
                      fontWeight: "bold",
                    }}
                  >
                    {getFocusRemainingTime()}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                    {t("blocking.timeRemaining")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            /* Schedules Section - Active first, then Upcoming */
            <View>
              {/* Active Schedules */}
              {upcomingSchedules.filter((s) => getScheduleStatus(s).isActive).length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#10b981",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Active Now
                  </Text>
                  {upcomingSchedules
                    .filter((s) => getScheduleStatus(s).isActive)
                    .map((schedule) => {
                      const status = getScheduleStatus(schedule);
                      return (
                        <TouchableOpacity
                          key={schedule.id}
                          onPress={() => router.push("/(tabs)/blocking")}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: isDark
                              ? "rgba(16, 185, 129, 0.1)"
                              : "rgba(16, 185, 129, 0.08)",
                            borderRadius: 14,
                            padding: 14,
                            marginBottom: 10,
                            borderWidth: 1,
                            borderColor: "#10b981",
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: "rgba(16, 185, 129, 0.2)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                              }}
                            >
                              <Shield size={18} color="#10b981" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "600",
                                  color: isDark ? "#ffffff" : "#111827",
                                  marginBottom: 2,
                                }}
                              >
                                {schedule.name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: isDark ? "#9ca3af" : "#6b7280",
                                }}
                              >
                                {getScheduleDaysLabel(schedule.daysOfWeek)} • {schedule.startTime} - {schedule.endTime}
                              </Text>
                            </View>
                            <ChevronRight size={18} color="#10b981" />
                          </View>
                          {/* Countdown below */}
                          <View
                            style={{
                              marginTop: 10,
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              alignSelf: "flex-start",
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Clock size={12} color="#10b981" style={{ marginRight: 5 }} />
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: "#10b981",
                              }}
                            >
                              {status.text}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              )}

              {/* Upcoming Schedules */}
              {upcomingSchedules.filter((s) => !getScheduleStatus(s).isActive).length > 0 && (
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isDark ? "#9ca3af" : "#6b7280",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t("home.upcomingSchedules") || "Upcoming"}
                  </Text>
                  {upcomingSchedules
                    .filter((s) => !getScheduleStatus(s).isActive)
                    .map((schedule) => {
                      const status = getScheduleStatus(schedule);
                      return (
                        <TouchableOpacity
                          key={schedule.id}
                          onPress={() => router.push("/(tabs)/blocking")}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: isDark
                              ? "rgba(255, 255, 255, 0.05)"
                              : "#ffffff",
                            borderRadius: 14,
                            padding: 14,
                            marginBottom: 10,
                            borderWidth: 1,
                            borderColor: isDark
                              ? "rgba(255, 255, 255, 0.08)"
                              : "rgba(0, 0, 0, 0.06)",
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: isDark
                                  ? "rgba(59, 130, 246, 0.15)"
                                  : "rgba(59, 130, 246, 0.1)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                              }}
                            >
                              <Calendar size={18} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "600",
                                  color: isDark ? "#ffffff" : "#111827",
                                  marginBottom: 2,
                                }}
                              >
                                {schedule.name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: isDark ? "#9ca3af" : "#6b7280",
                                }}
                              >
                                {getScheduleDaysLabel(schedule.daysOfWeek)} • {schedule.startTime} - {schedule.endTime}
                              </Text>
                            </View>
                            <ChevronRight size={18} color={isDark ? "#6b7280" : "#9ca3af"} />
                          </View>
                          {/* Starting time below */}
                          {status.text && (
                            <View
                              style={{
                                marginTop: 10,
                                backgroundColor: isDark
                                  ? "rgba(255, 255, 255, 0.08)"
                                  : "rgba(0, 0, 0, 0.04)",
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                                alignSelf: "flex-start",
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Clock size={12} color={isDark ? "#9ca3af" : "#6b7280"} style={{ marginRight: 5 }} />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "500",
                                  color: isDark ? "#9ca3af" : "#6b7280",
                                }}
                              >
                                {status.text}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              )}

              {/* No Schedules - Create One */}
              {upcomingSchedules.length === 0 && (
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isDark ? "#9ca3af" : "#6b7280",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t("home.upcomingSchedules") || "Upcoming"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/blocking?openSchedule=true")}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isDark
                        ? "rgba(59, 130, 246, 0.08)"
                        : "rgba(59, 130, 246, 0.05)",
                      borderRadius: 14,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: "#3b82f6",
                      borderStyle: "dashed",
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: "#3b82f6",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Plus size={20} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#3b82f6",
                          marginBottom: 2,
                        }}
                      >
                        {t("home.createSchedule") || "Create a Schedule"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDark ? "#9ca3af" : "#6b7280",
                        }}
                      >
                        {t("blocking.createScheduleHint")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* App Usage Today Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {t("home.appUsageToday")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/stats")}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#3b82f6",
                  fontWeight: "600",
                  marginRight: 4,
                }}
              >
                {t("profile.viewAll")}
              </Text>
              <ChevronRight size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {isLoadingApps ? (
            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
                borderRadius: 16,
                padding: 40,
                alignItems: "center",
              }}
            >
              <Text style={{ color: isDark ? "#9ca3af" : "#6b7280", fontSize: 14 }}>
                {t("home.loadingApps")}
              </Text>
            </View>
          ) : appsUsage.length > 0 ? (
            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
              }}
            >
              {appsUsage.map((app, index) => (
                <View
                  key={app.packageName || index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderBottomWidth: index < appsUsage.length - 1 ? 1 : 0,
                    borderBottomColor: isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(0, 0, 0, 0.04)",
                  }}
                >
                  {/* App Icon with Blocked Badge */}
                  <View style={{ position: "relative", marginRight: 12 }}>
                    {app.iconUrl ? (
                      <Image
                        source={{ uri: app.iconUrl }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          opacity: isAppBlocked(app.packageName) ? 0.5 : 1,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: isDark ? "#374151" : "#e5e7eb",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: isAppBlocked(app.packageName) ? 0.5 : 1,
                        }}
                      >
                        <Smartphone size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                      </View>
                    )}
                    {/* Blocked Badge */}
                    {isAppBlocked(app.packageName) && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: -4,
                          right: -4,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: "#ef4444",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 2,
                          borderColor: isDark ? "#000000" : "#ffffff",
                        }}
                      >
                        <Lock size={10} color="#ffffff" strokeWidth={3} />
                      </View>
                    )}
                  </View>

                  {/* App Name */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: isDark ? "#ffffff" : "#111827",
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {app.appName || "Unknown App"}
                    </Text>
                    {/* Usage Progress Bar */}
                    <View
                      style={{
                        height: 4,
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.06)",
                        borderRadius: 2,
                        marginTop: 4,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${Math.min(
                            (app.usageTime / (appsUsage[0]?.usageTime || 1)) * 100,
                            100
                          )}%`,
                          backgroundColor:
                            index === 0
                              ? "#ef4444"
                              : index === 1
                              ? "#f59e0b"
                              : "#3b82f6",
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  </View>

                  {/* Usage Time */}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isDark ? "#9ca3af" : "#6b7280",
                      marginLeft: 12,
                    }}
                  >
                    {formatDuration(app.usageTime)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
                borderRadius: 16,
                padding: 40,
                alignItems: "center",
              }}
            >
              <Smartphone
                size={40}
                color={isDark ? "#4b5563" : "#9ca3af"}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={{
                  color: isDark ? "#9ca3af" : "#6b7280",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {t("stats.noUsageData")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quick Action Menu - Backdrop */}
      {quickMenuOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleMenu}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
            }}
          />
        </TouchableOpacity>
      )}

      {/* Menu Items - 4 Options */}
      {quickMenuOpen && (
        <>
          {/* Item 1 - Block Now (Top) */}
          {(() => {
            const iconScale = icon1Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            });
            const iconTranslateY = icon1Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [280, 0],
            });

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 420,
                  right: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  opacity: icon1Anim,
                  transform: [{ translateY: iconTranslateY }, { scale: iconScale }],
                }}
              >
                <Animated.View
                  style={{
                    opacity: text1Anim,
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: 16,
                      marginBottom: 2,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Block Now
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Block apps for a set duration
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/(tabs)/blocking?openFocus=true"), 300);
                  }}
                  activeOpacity={0.8}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#f59e0b",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={["#fbbf24", "#f59e0b", "#d97706"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Zap size={26} color="#ffffff" fill="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}

          {/* Item 2 - Schedule Block */}
          {(() => {
            const iconScale = icon2Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            });
            const iconTranslateY = icon2Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [200, 0],
            });

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 350,
                  right: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  opacity: icon2Anim,
                  transform: [{ translateY: iconTranslateY }, { scale: iconScale }],
                }}
              >
                <Animated.View
                  style={{
                    opacity: text2Anim,
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: 16,
                      marginBottom: 2,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Schedule Block
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Block on the times and days
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/(tabs)/blocking?openSchedule=true"), 300);
                  }}
                  activeOpacity={0.8}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#3b82f6",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={["#60a5fa", "#3b82f6", "#2563eb"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Calendar size={26} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}

          {/* Item 3 - Set Limits */}
          {(() => {
            const iconScale = icon3Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            });
            const iconTranslateY = icon3Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [120, 0],
            });

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 280,
                  right: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  opacity: icon3Anim,
                  transform: [{ translateY: iconTranslateY }, { scale: iconScale }],
                }}
              >
                <Animated.View
                  style={{
                    opacity: text3Anim,
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: 16,
                      marginBottom: 2,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Set Limits
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Set daily usage limits
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/(tabs)/blocking?openLimits=true"), 300);
                  }}
                  activeOpacity={0.8}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#8b5cf6",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={["#a78bfa", "#8b5cf6", "#7c3aed"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Timer size={26} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}

          {/* Item 4 - Focus Mode */}
          {(() => {
            const iconScale = icon4Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            });
            const iconTranslateY = icon4Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            });

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 210,
                  right: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  opacity: icon4Anim,
                  transform: [{ translateY: iconTranslateY }, { scale: iconScale }],
                }}
              >
                <Animated.View
                  style={{
                    opacity: text4Anim,
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: 16,
                      marginBottom: 2,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Focus Mode
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Block until you complete a task
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/(tabs)/detox"), 300);
                  }}
                  activeOpacity={0.8}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={["#34d399", "#10b981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Target size={26} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}
        </>
      )}

      {/* Main Floating Action Button - Square with X when open */}
      <TouchableOpacity
        onPress={toggleMenu}
        activeOpacity={0.9}
        style={{
          position: "absolute",
          bottom: 140,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: quickMenuOpen ? 1 : 0,
          borderColor: "rgba(255, 255, 255, 0.3)",
          shadowColor: quickMenuOpen ? "transparent" : accentColor.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: quickMenuOpen ? 0 : 8,
        }}
      >
        {quickMenuOpen ? (
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={28} color="#ffffff" strokeWidth={2} />
          </View>
        ) : (
          <LinearGradient
            colors={[accentColor.primary, accentColor.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={26} color="#ffffff" fill="#ffffff" />
          </LinearGradient>
        )}
      </TouchableOpacity>

        {/* Help Carousel Modal */}
        <HelpCarousel
          visible={showHelpCarousel}
          cards={homeHelpCards}
          onClose={() => setShowHelpCarousel(false)}
        />
      </SafeAreaView>
    </ThemedBackground>
  );
}
