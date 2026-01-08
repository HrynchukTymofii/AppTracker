import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Share2, TrendingDown, TrendingUp, BarChart3 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ThemedBackground } from "@/components/ui/ThemedBackground";
import {
  getWeekUsageStatsWithOffset,
  getDailyUsageForWeek,
  formatDuration,
  calculateHealthScore,
  getOrbLevel,
  getTodayUsageStats,
  getWeekComparison,
  getDailyUsageForMonth,
  WeekComparisonData,
} from "@/lib/usageTracking";
import {
  initUsageDatabase,
  saveDailyUsage,
  getWeekUsage,
  hasDataForRange,
  formatDate,
  getWeekDateRange,
  getAllDatesWithData,
} from "@/lib/usageDatabase";

// Import extracted components
import {
  getLocalIcon,
  ShimmerEffect,
  SkeletonDayCard,
  SkeletonStatCard,
  SkeletonChart,
  SkeletonAppItem,
  AnimatedBar,
  DayCard,
  StatCard,
  AppUsageItem,
  CalendarHeatmap,
  DayTooltip,
  ShareCard,
} from "@/components/stats";

export default function StatsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [weekOffset, setWeekOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
  const [hasCurrentWeekData, setHasCurrentWeekData] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [showShareCard, setShowShareCard] = useState(false);
  const [weekComparison, setWeekComparison] = useState<WeekComparisonData | null>(null);

  // State for real data
  const [stats, setStats] = useState<{
    totalHours: number | string;
    dailyAvg: number | string;
    peekDay: string;
    peekHours: number | string;
    pickupsTotal: number | string;
    pickupsAvg: number | string;
  }>({
    totalHours: "--",
    dailyAvg: "--",
    peekDay: "--",
    peekHours: "--",
    pickupsTotal: "--",
    pickupsAvg: "--",
  });
  const [chartData, setChartData] = useState<{ day: string; hours: number }[]>([]);
  const [appsUsage, setAppsUsage] = useState<any[]>([]);
  const [weekDates, setWeekDates] = useState<any[]>([]);

  // Initialize database (non-blocking - backfill runs in background)
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await initUsageDatabase();
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };

    initDatabase();

    // Backfill runs in background after a short delay - doesn't block UI
    const backfillTimeout = setTimeout(() => {
      const backfillData = async () => {
        try {
          // Get current month daily data
          const monthDailyData = await getDailyUsageForMonth(0);
          const weekStats = await getWeekUsageStatsWithOffset(0);

          // Save each day from the month (in background)
          for (const dayData of monthDailyData) {
            if (dayData && dayData.hours > 0) {
              const healthScore = calculateHealthScore(
                dayData.hours * 60 * 60 * 1000,
                dayData.pickups
              );
              const orbLevel = getOrbLevel(healthScore);

              await saveDailyUsage(
                dayData.date,
                dayData.hours * 60 * 60 * 1000,
                dayData.pickups,
                healthScore,
                orbLevel,
                weekStats.apps
              );
            }
          }
          console.log("Database backfilled with month data");
        } catch (error) {
          console.error("Error backfilling database:", error);
          // Don't throw - backfill failure shouldn't crash the app
        }
      };

      backfillData();
    }, 2000); // Wait 2 seconds before starting backfill to let UI load first

    return () => clearTimeout(backfillTimeout);
  }, []);

  // Load calendar data when calendar view is shown or weekOffset changes
  useEffect(() => {
    if (showCalendar) {
      loadCalendarData();
    }
  }, [showCalendar, weekOffset]);

  const loadCalendarData = async () => {
    try {
      // Get data from database
      const dbData = await getAllDatesWithData();

      // Also generate data for the month containing the selected week
      // This ensures we have something to show even if DB doesn't have it
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - 6 + (weekOffset * 7));

      // Get the month containing this week
      const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
      const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);

      // Create a map of existing data
      const dataMap = new Map(dbData.map((d: any) => [d.date, d]));

      // Generate entries for all days in the month that we don't have
      const allData = [...dbData];
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        if (!dataMap.has(dateStr) && d <= new Date()) {
          // Add placeholder with default health score
          allData.push({
            date: dateStr,
            health_score: 50,
            screen_time: 0,
            pickups: 0,
          });
        }
      }

      setCalendarData(allData);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  };

  // Save today's data periodically
  useEffect(() => {
    const saveTodayData = async () => {
      try {
        const todayStats = await getTodayUsageStats();
        if (todayStats.hasRealData) {
          const today = formatDate(new Date());
          const healthScore = calculateHealthScore(
            todayStats.totalScreenTime,
            todayStats.pickups
          );
          const orbLevel = getOrbLevel(healthScore);

          await saveDailyUsage(
            today,
            todayStats.totalScreenTime,
            todayStats.pickups,
            healthScore,
            orbLevel,
            todayStats.apps
          );
        }
      } catch (error) {
        console.error("Error saving today data:", error);
      }
    };

    // Save immediately and then every 30 minutes
    saveTodayData();
    const interval = setInterval(saveTodayData, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check current week data availability
      const { startDate, endDate } = getWeekDateRange(weekOffset);
      const hasData = await hasDataForRange(startDate, endDate);
      setHasCurrentWeekData(hasData || weekOffset === 0);

      // Check if previous week has data before allowing navigation back (max -3 weeks = ~1 month)
      let canNavigateBack = false;
      if (weekOffset > -3) {
        const prevWeekRange = getWeekDateRange(weekOffset - 1);
        const hasPrevWeekData = await hasDataForRange(prevWeekRange.startDate, prevWeekRange.endDate);
        canNavigateBack = hasPrevWeekData;
      }
      setCanGoPrev(canNavigateBack);
      setCanGoNext(weekOffset < 0);

      // Get week usage stats
      const weekStats = await getWeekUsageStatsWithOffset(weekOffset);
      const dailyStats = await getDailyUsageForWeek(weekOffset);

      // Fetch week comparison for share feature (only for current week)
      if (weekOffset === 0) {
        try {
          const comparison = await getWeekComparison();
          setWeekComparison(comparison);
        } catch (e) {
          console.error("Error fetching week comparison:", e);
        }
      }

      // Calculate stats - always show values (even if 0)
      const hasRealData = weekStats.totalScreenTime > 0 || weekStats.pickups > 0 || dailyStats.some(d => d.hours > 0);
      const daysWithData = dailyStats.filter(d => d.hours > 0).length || 1; // At least 1 to avoid division by 0
      const totalHours = weekStats.totalScreenTime / (1000 * 60 * 60);
      const dailyAvg = totalHours / Math.max(daysWithData, 1);
      const peekDayData = dailyStats.reduce((max, curr) => curr.hours > max.hours ? curr : max, dailyStats[0] || { day: "Mon", hours: 0 });

      setStats({
        totalHours: Math.round(totalHours * 10) / 10,
        dailyAvg: Math.round(dailyAvg * 10) / 10,
        peekDay: peekDayData?.day || "Mon",
        peekHours: Math.round((peekDayData?.hours || 0) * 10) / 10,
        pickupsTotal: weekStats.pickups,
        pickupsAvg: Math.round(weekStats.pickups / Math.max(daysWithData, 1)),
      });

      // Set chart data - ensure exactly 7 days
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const chartStartDate = new Date();
      chartStartDate.setHours(0, 0, 0, 0);
      chartStartDate.setDate(chartStartDate.getDate() - 6 + (weekOffset * 7));

      // Create a map from dailyStats for quick lookup
      const dailyMap = new Map<number, number>();
      dailyStats.forEach((stat, idx) => {
        dailyMap.set(idx, stat.hours || 0);
      });

      // Generate exactly 7 chart items
      const chartItems = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(chartStartDate);
        date.setDate(chartStartDate.getDate() + i);
        return {
          day: dayNames[date.getDay()],
          hours: dailyMap.get(i) ?? dailyStats[i]?.hours ?? 0,
        };
      });
      setChartData(chartItems);

      // Format apps usage
      const maxTime = Math.max(...weekStats.apps.map(a => a.timeInForeground), 1);
      const formattedApps = weekStats.apps.map((app, index) => {
        const localIcon = getLocalIcon(app.packageName || "", app.appName);
        return {
          id: app.packageName || index.toString(),
          appName: app.appName,
          duration: formatDuration(app.timeInForeground),
          minutes: app.timeInForeground / 60000,
          percentage: (app.timeInForeground / maxTime) * 100,
          iconUrl: localIcon || app.iconUrl || require("@/assets/images/splash-icon.png"),
        };
      });
      setAppsUsage(formattedApps);

      // Generate week dates with orb levels - ensure exactly 7 days
      const storedWeekData = await getWeekUsage(startDate, endDate);
      const storedDataMap = new Map(storedWeekData.map(d => [d.date, d]));

      const weekStartDate = new Date();
      weekStartDate.setHours(0, 0, 0, 0);
      weekStartDate.setDate(weekStartDate.getDate() - 6 + (weekOffset * 7));

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStartDate);
        date.setDate(weekStartDate.getDate() + i);
        date.setHours(0, 0, 0, 0);
        const dateStr = formatDate(date);
        const dayData = dailyStats[i];

        const isFutureDate = date > currentDate;
        const storedDay = storedDataMap.get(dateStr);
        const dayHasData = !isFutureDate && !!(storedDay || (dayData !== undefined && dayData !== null && dayData.hours > 0));

        const actualHours = (dayData?.hours || 0) * 60 * 60 * 1000;
        const actualPickups = hasRealData && daysWithData > 0 ? Math.round(weekStats.pickups / daysWithData) : 0;
        const healthScore = dayHasData && hasRealData
          ? calculateHealthScore(actualHours, actualPickups)
          : 50;

        return {
          dayName: dayNames[date.getDay()],
          dateNumber: date.getDate(),
          orbLevel: getOrbLevel(healthScore),
          hasData: dayHasData,
        };
      });
      setWeekDates(dates);

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getWeekLabel = () => {
    if (weekOffset === 0) return t("stats.thisWeek");
    if (weekOffset === -1) return t("stats.lastWeek");
    if (weekOffset > 0) return t("stats.weeksAhead", { count: weekOffset });
    return t("stats.weeksAgo", { count: Math.abs(weekOffset) });
  };

  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading && !refreshing ? (
          <>
            {/* Skeleton Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                }}
              />
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "800",
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: -0.5,
                  }}
                >
                  {t("stats.title")}
                </Text>
                <ShimmerEffect isDark={isDark} style={{ width: 80, height: 14, marginTop: 4, borderRadius: 4 }} />
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                }}
              />
            </View>

            {/* Skeleton Day Cards */}
            {/* <View style={{ marginTop: 20, marginBottom: 24, alignItems: "center" }}>
              <View style={{ flexDirection: "row", justifyContent: "center", paddingHorizontal: 16 }}>
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                  <SkeletonDayCard key={index} isDark={isDark} />
                ))}
              </View>
            </View> */}

            {/* Skeleton Stats Cards */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                <SkeletonStatCard isDark={isDark} />
                <SkeletonStatCard isDark={isDark} />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <SkeletonStatCard isDark={isDark} />
                <SkeletonStatCard isDark={isDark} />
              </View>
            </View>

            {/* Skeleton Chart */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <ShimmerEffect isDark={isDark} style={{ width: 100, height: 16, borderRadius: 4 }} />
                  <ShimmerEffect isDark={isDark} style={{ width: 36, height: 36, borderRadius: 10 }} />
                </View>
                <SkeletonChart isDark={isDark} />
              </View>
            </View>

            {/* Skeleton App Usage */}
            <View style={{ paddingHorizontal: 20 }}>
              <ShimmerEffect isDark={isDark} style={{ width: 140, height: 18, marginBottom: 16, borderRadius: 4 }} />
              <SkeletonAppItem isDark={isDark} />
              <SkeletonAppItem isDark={isDark} />
              <SkeletonAppItem isDark={isDark} />
            </View>
          </>
        ) : (
          <>
            {/* Header with Week Navigation */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => canGoPrev && setWeekOffset(weekOffset - 1)}
                disabled={!canGoPrev}
                activeOpacity={0.7}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: canGoPrev ? 1 : 0.3,
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.03,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <ChevronLeft size={20} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
              </TouchableOpacity>

              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "800",
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: -0.5,
                  }}
                >
                  {t("stats.title")}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                    marginTop: 4,
                  }}
                >
                  {getWeekLabel()}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => canGoNext && setWeekOffset(weekOffset + 1)}
                disabled={!canGoNext}
                activeOpacity={0.7}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: canGoNext ? 1 : 0.3,
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.03,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <ChevronRight size={20} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            {/* 7 Days Cards */}
            {/* <View style={{ marginTop: 12, marginBottom: 28, alignItems: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  paddingHorizontal: 16,
                }}
              >
                {weekDates.map((item, index) => (
                  <DayCard
                    key={index}
                    dayName={item.dayName}
                    dateNumber={item.dateNumber}
                    orbLevel={item.orbLevel}
                    isDark={isDark}
                    hasData={item.hasData}
                  />
                ))}
              </View>
            </View> */}

            {/* Week Comparison Card */}
            {weekOffset === 0 && weekComparison && (
              <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                <TouchableOpacity
                  onPress={() => setShowShareCard(true)}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 0.5,
                    overflow: "hidden",
                    backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
                    borderColor: weekComparison.comparison.improved
                      ? isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.5)"
                      : isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.5)",
                  }}
                >
                  <LinearGradient
                    colors={weekComparison.comparison.improved
                      ? isDark ? ["rgba(16, 185, 129, 0.15)", "rgba(16, 185, 129, 0.05)"] : ["rgba(16, 185, 129, 0.20)", "rgba(16, 185, 129, 0.08)"]
                      : isDark ? ["rgba(239, 68, 68, 0.15)", "rgba(239, 68, 68, 0.05)"] : ["rgba(239, 68, 68, 0.20)", "rgba(239, 68, 68, 0.08)"]
                    }
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                          fontWeight: "600",
                          marginBottom: 6,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                        }}
                      >
                        {t("stats.vsLastWeek")}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: weekComparison.comparison.improved
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {weekComparison.comparison.improved ? (
                            <TrendingDown size={20} color="#10b981" strokeWidth={2} />
                          ) : (
                            <TrendingUp size={20} color="#ef4444" strokeWidth={2} />
                          )}
                        </View>
                        <View>
                          <Text
                            style={{
                              fontSize: 28,
                              fontWeight: "800",
                              color: weekComparison.comparison.improved ? "#10b981" : "#ef4444",
                              letterSpacing: -0.5,
                            }}
                          >
                            {Math.abs(weekComparison.comparison.hoursPercentChange)}%
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                            }}
                          >
                            {weekComparison.comparison.improved
                              ? t("stats.lessScreenTime")
                              : t("stats.moreScreenTime")}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Mini comparison */}
                    <View style={{ alignItems: "flex-end", marginRight: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                          {weekComparison.thisWeek.totalHours}h
                        </Text>
                        <Text style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8" }}>
                          vs {weekComparison.lastWeek.totalHours}h
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8", marginTop: 2 }}>
                        {weekComparison.comparison.hoursDiff > 0 ? "+" : ""}
                        {weekComparison.comparison.hoursDiff}h {t("stats.difference")}
                      </Text>
                    </View>

                    {/* Share button */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Share2 size={18} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* 2x2 Stats Table */}
            <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <StatCard
                  title={t("stats.totalHours")}
                  value={stats.totalHours === "--" ? "--" : `${stats.totalHours}h`}
                  isDark={isDark}
                  animated={typeof stats.totalHours === "number"}
                  numericValue={typeof stats.totalHours === "number" ? stats.totalHours : undefined}
                  suffix="h"
                />
                <StatCard
                  title={t("stats.dailyAvg")}
                  value={stats.dailyAvg === "--" ? "--" : `${stats.dailyAvg}h`}
                  isDark={isDark}
                  animated={typeof stats.dailyAvg === "number"}
                  numericValue={typeof stats.dailyAvg === "number" ? stats.dailyAvg : undefined}
                  suffix="h"
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <StatCard
                  title={t("stats.peekDay")}
                  value={stats.peekDay}
                  subtitle={stats.peekHours === "--" ? "--" : `${stats.peekHours}h`}
                  isDark={isDark}
                />
                <StatCard
                  title={t("stats.pickups")}
                  value={stats.pickupsTotal === "--" ? "--" : `${stats.pickupsTotal}`}
                  subtitle={stats.pickupsAvg === "--" ? "--" : `${stats.pickupsAvg}${t("stats.perDay")}`}
                  isDark={isDark}
                  animated={typeof stats.pickupsTotal === "number"}
                  numericValue={typeof stats.pickupsTotal === "number" ? stats.pickupsTotal : undefined}
                  suffix=""
                />
              </View>
            </View>

            {/* Bar Chart or Calendar */}
            <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
              <View
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  borderRadius: 20,
                  padding: 20,
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
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
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
                        colors={showCalendar ? ["#8b5cf6", "#6d28d9"] : ["#3b82f6", "#1d4ed8"]}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      />
                      {showCalendar ? (
                        <CalendarIcon size={16} color="#ffffff" strokeWidth={2} />
                      ) : (
                        <BarChart3 size={16} color="#ffffff" strokeWidth={2} />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: isDark ? "#ffffff" : "#0f172a",
                        letterSpacing: -0.3,
                      }}
                    >
                      {showCalendar ? t("stats.usageCalendar") : t("stats.statsPerDay")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowCalendar(!showCalendar)}
                    activeOpacity={0.7}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 0.5,
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    {showCalendar ? (
                      <BarChart3 size={18} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
                    ) : (
                      <CalendarIcon size={18} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                </View>

                {showCalendar ? (
                  <CalendarHeatmap
                    data={calendarData}
                    isDark={isDark}
                    onDayPress={(day) => setSelectedDay(day)}
                    weekOffset={weekOffset}
                  />
                ) : (
                  <View style={{ position: "relative" }}>
                    {/* Average line */}
                    {(() => {
                      const maxHours = Math.max(...chartData.map((d) => d.hours), 1);
                      const dailyAvgNum = typeof stats.dailyAvg === "number" ? stats.dailyAvg : 0;
                      const avgBarHeight = (dailyAvgNum / maxHours) * 120;
                      const avgLinePosition = 120 - avgBarHeight - 10;
                      return dailyAvgNum > 0 ? (
                        <View
                          style={{
                            position: "absolute",
                            top: avgLinePosition,
                            left: 0,
                            right: 0,
                            flexDirection: "row",
                            alignItems: "center",
                            zIndex: 10,
                          }}
                        >
                          <View
                            style={{
                              flex: 1,
                              height: 1,
                              borderStyle: "dashed",
                              borderWidth: 1,
                              borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)",
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 9,
                              color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.3)",
                              marginLeft: 6,
                              fontWeight: "600",
                            }}
                          >
                            avg
                          </Text>
                        </View>
                      ) : null;
                    })()}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        height: 150,
                      }}
                    >
                      {chartData.map((item, index) => {
                        const maxHours = Math.max(...chartData.map((d) => d.hours), 1);
                        return (
                          <View
                            key={index}
                            style={{
                              flex: 1,
                              alignItems: "center",
                              marginHorizontal: 4,
                            }}
                          >
                            <AnimatedBar
                              height={item.hours}
                              maxHeight={maxHours}
                              isDark={isDark}
                              delay={index * 80}
                            />
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "600",
                                color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                              }}
                            >
                              {item.day}
                            </Text>
                            <Text
                              style={{
                                fontSize: 10,
                                color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8",
                              }}
                            >
                              {item.hours}h
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* App Usage List */}
            {hasCurrentWeekData && appsUsage.length > 0 && (
              <View style={{ paddingHorizontal: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
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
                      colors={isDark ? ["#ec4899", "#be185d"] : ["#ec4899", "#db2777"]}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    />
                    <BarChart3 size={16} color="#ffffff" strokeWidth={2} />
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isDark ? "#ffffff" : "#0f172a",
                      letterSpacing: -0.3,
                    }}
                  >
                    {t("stats.totalTimePerApp")}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                    borderRadius: 20,
                    padding: 8,
                    borderWidth: 0.5,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0 : 0.03,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                >
                  {appsUsage.map((app, index) => (
                    <AppUsageItem
                      key={app.id}
                      appName={app.appName}
                      duration={app.duration}
                      percentage={app.percentage}
                      iconUrl={app.iconUrl}
                      isDark={isDark}
                      index={index}
                      isLast={index === appsUsage.length - 1}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Day Details Tooltip */}
      <DayTooltip
        visible={!!selectedDay}
        day={selectedDay}
        isDark={isDark}
        onClose={() => setSelectedDay(null)}
      />

      {/* Share Card Modal */}
      {showShareCard && weekComparison && (
        <ShareCard
          comparison={weekComparison}
          onClose={() => setShowShareCard(false)}
          isDark={isDark}
        />
      )}
      </SafeAreaView>
    </ThemedBackground>
  );
}
