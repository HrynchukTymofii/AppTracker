import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StyleSheet,
} from "react-native";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Share2, TrendingDown, TrendingUp, BarChart3 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
import { fetchAppIcons, getAppIcon } from "@/lib/iconCache";

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

  // Helper to localize English day names from native module
  const localizeDayName = (englishDay: string): string => {
    const dayMap: Record<string, string> = {
      'Sun': t("common.dayNames.sun"),
      'Mon': t("common.dayNames.mon"),
      'Tue': t("common.dayNames.tue"),
      'Wed': t("common.dayNames.wed"),
      'Thu': t("common.dayNames.thu"),
      'Fri': t("common.dayNames.fri"),
      'Sat': t("common.dayNames.sat"),
    };
    return dayMap[englishDay] || englishDay;
  };
  const [weekOffset, setWeekOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparisonLoading, setIsComparisonLoading] = useState(true);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
  const [hasCurrentWeekData, setHasCurrentWeekData] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [showShareCard, setShowShareCard] = useState(false);
  const [weekComparison, setWeekComparison] = useState<WeekComparisonData | null>(null);
  const [iconsLoaded, setIconsLoaded] = useState(false);

  // Animation for comparison card
  const comparisonFadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger fade-in when comparison data loads
  useEffect(() => {
    if (weekComparison && !isComparisonLoading) {
      comparisonFadeAnim.setValue(0);
      Animated.timing(comparisonFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [weekComparison, isComparisonLoading]);

  // State for real data
  const [stats, setStats] = useState<{
    totalHours: number | string;
    dailyAvg: number | string;
    peekDay: string;
    peekHours: number | string;
    unlocksTotal: number | string;
    unlocksAvg: number | string;
  }>({
    totalHours: "--",
    dailyAvg: "--",
    peekDay: "--",
    peekHours: "--",
    unlocksTotal: "--",
    unlocksAvg: "--",
  });
  const [chartData, setChartData] = useState<{ day: string; hours: number }[]>([]);
  const [appsUsage, setAppsUsage] = useState<any[]>([]);
  const [weekDates, setWeekDates] = useState<any[]>([]);

  useEffect(() => {
    console.log("🧠 Stats mounted");

    return () => {
      console.log("🧹 Stats unmounted");
    };
  }, []);

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
                dayData.unlocks
              );
              const orbLevel = getOrbLevel(healthScore);

              await saveDailyUsage(
                dayData.date,
                dayData.hours * 60 * 60 * 1000,
                dayData.unlocks,
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
    console.log("Ststs useeffect");
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
    console.log("Ststs useeffect2");
    const saveTodayData = async () => {
      try {
        const todayStats = await getTodayUsageStats();
        if (todayStats.hasRealData) {
          const today = formatDate(new Date());
          const healthScore = calculateHealthScore(
            todayStats.totalScreenTime,
            todayStats.unlocks
          );
          const orbLevel = getOrbLevel(healthScore);

          await saveDailyUsage(
            today,
            todayStats.totalScreenTime,
            todayStats.unlocks,
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
    const startTime = Date.now();
    console.log('[Stats] fetchData START');

    try {
      setIsLoading(true);
      setIsComparisonLoading(true);
      setWeekComparison(null);

      // Check current week data availability
      const { startDate, endDate } = getWeekDateRange(weekOffset);
      console.log('[Stats] Date range:', startDate, '-', endDate, `(${Date.now() - startTime}ms)`);

      // Run initial checks in parallel
      console.log('[Stats] Starting parallel fetch...');
      const parallelStart = Date.now();

      // Create promises separately to add error handling
      const hasDataPromise = hasDataForRange(startDate, endDate)
        .then(r => { console.log('[Stats] hasDataForRange done', `(${Date.now() - parallelStart}ms)`); return r; })
        .catch(e => { console.error('[Stats] hasDataForRange ERROR:', e); return false; });

      const weekStatsPromise = getWeekUsageStatsWithOffset(weekOffset)
        .then(r => { console.log('[Stats] getWeekUsageStatsWithOffset done', `(${Date.now() - parallelStart}ms)`); return r; })
        .catch(e => { console.error('[Stats] getWeekUsageStatsWithOffset ERROR:', e); return { apps: [], totalScreenTime: 0, unlocks: 0, hasRealData: false }; });

      const dailyStatsPromise = getDailyUsageForWeek(weekOffset)
        .then(r => { console.log('[Stats] getDailyUsageForWeek done', `(${Date.now() - parallelStart}ms)`); return r; })
        .catch(e => { console.error('[Stats] getDailyUsageForWeek ERROR:', e); return []; });

      console.log('[Stats] All promises created, awaiting...');
      const [hasData, weekStats, dailyStats] = await Promise.all([hasDataPromise, weekStatsPromise, dailyStatsPromise]);

      console.log('[Stats] Parallel fetch completed', `(${Date.now() - startTime}ms total)`);
      console.log('[Stats] weekStats:', {
        totalScreenTime: weekStats.totalScreenTime,
        unlocks: weekStats.unlocks,
        appsCount: weekStats.apps?.length,
        hasRealData: weekStats.hasRealData,
        topApp: weekStats.apps?.[0]?.appName,
      });
      console.log('[Stats] dailyStats:', dailyStats?.map(d => `${d.day}:${d.hours}h`).join(', '));

      setHasCurrentWeekData(hasData || weekOffset === 0);

      // Check navigation availability
      // Android provides current week + 3 previous weeks max
      // TODO: Re-enable week navigation after debugging older week data
      // setCanGoPrev(weekOffset > -3); // Allow up to 3 weeks back (current + 3 previous)
      // setCanGoNext(weekOffset < 0);
      setCanGoPrev(false); // Disabled for now - only show current week
      setCanGoNext(false);

      // Fetch week comparison in background (only for current week) - don't block main stats
      if (weekOffset === 0) {
        getWeekComparison()
          .then(comparison => {
            console.log('[Stats] Week comparison:', {
              thisWeek: comparison.thisWeek.totalHours + 'h',
              lastWeek: comparison.lastWeek.totalHours + 'h',
              diff: comparison.comparison.hoursDiff + 'h',
              improved: comparison.comparison.improved,
            });
            setWeekComparison(comparison);
          })
          .catch(e => {
            console.error("Error fetching week comparison:", e);
          })
          .finally(() => {
            setIsComparisonLoading(false);
          });
      } else {
        setIsComparisonLoading(false);
      }

      // Calculate stats - always show values (even if 0)
      const hasRealData = weekStats.totalScreenTime > 0 || weekStats.unlocks > 0 || dailyStats.some(d => d.hours > 0);
      const daysWithData = dailyStats.filter(d => d.hours > 0).length || 1; // At least 1 to avoid division by 0
      const totalHours = weekStats.totalScreenTime / (1000 * 60 * 60);
      const dailyAvg = totalHours / Math.max(daysWithData, 1);
      const peekDayData = dailyStats.reduce((max, curr) => curr.hours > max.hours ? curr : max, dailyStats[0] || { day: "Mon", hours: 0 });

      setStats({
        totalHours: Math.round(totalHours * 10) / 10,
        dailyAvg: Math.round(dailyAvg * 10) / 10,
        peekDay: peekDayData?.day || "Mon",
        peekHours: Math.round((peekDayData?.hours || 0) * 10) / 10,
        unlocksTotal: weekStats.unlocks,
        unlocksAvg: Math.round(weekStats.unlocks / Math.max(daysWithData, 1)),
      });

      // Set chart data - ensure exactly 7 days
      const dayNames = [
        t("common.dayNames.sun"),
        t("common.dayNames.mon"),
        t("common.dayNames.tue"),
        t("common.dayNames.wed"),
        t("common.dayNames.thu"),
        t("common.dayNames.fri"),
        t("common.dayNames.sat"),
      ];
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
        const cachedIcon = getAppIcon(app.packageName || "");
        return {
          id: app.packageName || index.toString(),
          packageName: app.packageName || "",
          appName: app.appName,
          duration: formatDuration(app.timeInForeground, t),
          minutes: app.timeInForeground / 60000,
          percentage: (app.timeInForeground / maxTime) * 100,
          iconUrl: localIcon || cachedIcon || app.iconUrl || null,
        };
      });
      setAppsUsage(formattedApps);

      // Fetch icons in background and update when ready
      fetchAppIcons().then(() => {
        const updatedApps = formattedApps.map(app => {
          const cachedIcon = getAppIcon(app.packageName);
          if (cachedIcon && !app.iconUrl) {
            return { ...app, iconUrl: cachedIcon };
          }
          return app;
        });
        setAppsUsage(updatedApps);
        setIconsLoaded(true);
      });

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
        const actualUnlocks = hasRealData && daysWithData > 0 ? Math.round(weekStats.unlocks / daysWithData) : 0;
        const healthScore = dayHasData && hasRealData
          ? calculateHealthScore(actualHours, actualUnlocks)
          : 50;

        return {
          dayName: dayNames[date.getDay()],
          dateNumber: date.getDate(),
          orbLevel: getOrbLevel(healthScore),
          hasData: dayHasData,
        };
      });
      setWeekDates(dates);
      console.log('[Stats] fetchData SUCCESS - all state updated', `(${Date.now() - startTime}ms total)`);

    } catch (error) {
      console.error("[Stats] fetchData ERROR:", error);
    } finally {
      console.log('[Stats] fetchData FINALLY - setting isLoading=false');
      setIsLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    console.log("[Stats] useEffect triggered, calling fetchData");
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

            {/* Loading Text */}
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                color: isDark ? "rgba(255, 255, 255, 0.5)" : "#6b7280",
                marginBottom: 20,
                paddingHorizontal: 20,
              }}
            >
              {t("stats.loadingNote") || "This can take a few seconds..."}
            </Text>

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
                  borderRadius: 20,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
                }}
              >
                <BlurView intensity={isDark ? 20 : 35} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={isDark ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"] : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={isDark ? ["rgba(255, 255, 255, 0.06)", "transparent"] : ["rgba(255, 255, 255, 0.4)", "transparent"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.6 }}
                  style={[StyleSheet.absoluteFill, { height: "60%" }]}
                />
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <ShimmerEffect isDark={isDark} style={{ width: 100, height: 16, borderRadius: 4 }} />
                    <ShimmerEffect isDark={isDark} style={{ width: 36, height: 36, borderRadius: 10 }} />
                  </View>
                  <SkeletonChart isDark={isDark} />
                </View>
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
            {/* TODO: Re-enable week navigation buttons after debugging older week data */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center", // Center since buttons are hidden
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 16,
              }}
            >
              {/* Navigation buttons commented out - only showing current week for now
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
              */}

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

              {/* Navigation buttons commented out - only showing current week for now
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
              */}
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
            {weekOffset === 0 && isComparisonLoading && (
              <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                <View
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <BlurView intensity={isDark ? 20 : 35} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={isDark ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"] : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={isDark ? ["rgba(255, 255, 255, 0.06)", "transparent"] : ["rgba(255, 255, 255, 0.4)", "transparent"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.6 }}
                    style={[StyleSheet.absoluteFill, { height: "60%" }]}
                  />
                  <View style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
                    {/* Real header - static elements */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text
                        style={{
                          fontSize: 16,
                          color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                          fontWeight: "600",
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                        }}
                      >
                        {t("stats.vsLastWeek")}
                      </Text>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Share2 size={16} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
                      </View>
                    </View>
                    {/* Skeleton content */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <ShimmerEffect isDark={isDark} style={{ width: 40, height: 40, borderRadius: 12 }} />
                        <View>
                          <ShimmerEffect isDark={isDark} style={{ width: 60, height: 28, borderRadius: 4, marginBottom: 4 }} />
                          <ShimmerEffect isDark={isDark} style={{ width: 90, height: 12, borderRadius: 4 }} />
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <ShimmerEffect isDark={isDark} style={{ width: 80, height: 20, borderRadius: 4, marginBottom: 4 }} />
                        <ShimmerEffect isDark={isDark} style={{ width: 60, height: 11, borderRadius: 4 }} />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
            {weekOffset === 0 && !isComparisonLoading && weekComparison && (
              <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                <Animated.View
                  style={{
                    borderRadius: 20,
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderWidth: 0.5,
                    overflow: "hidden",
                    backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
                    borderColor: weekComparison.comparison.improved
                      ? isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.5)"
                      : isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.5)",
                    opacity: comparisonFadeAnim,
                  }}
                >
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: comparisonFadeAnim,
                    }}
                  >
                    <LinearGradient
                      colors={weekComparison.comparison.improved
                        ? isDark ? ["rgba(16, 185, 129, 0.15)", "rgba(16, 185, 129, 0.05)"] : ["rgba(16, 185, 129, 0.20)", "rgba(16, 185, 129, 0.08)"]
                        : isDark ? ["rgba(239, 68, 68, 0.15)", "rgba(239, 68, 68, 0.05)"] : ["rgba(239, 68, 68, 0.20)", "rgba(239, 68, 68, 0.08)"]
                      }
                      style={{ flex: 1 }}
                    />
                  </Animated.View>

                  {/* Header row with title and share button */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 16,
                        color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                        fontWeight: "600",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("stats.vsLastWeek")}
                    </Text>

                    {/* Share button - top right */}
                    <TouchableOpacity
                      onPress={() => setShowShareCard(true)}
                      activeOpacity={0.7}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Share2 size={16} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>

                  {/* Main content */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
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
                    <View style={{ alignItems: "flex-end" }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                          {weekComparison.thisWeek.totalHours}{t("common.timeUnits.h")}
                        </Text>
                        <Text style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8" }}>
                          vs {weekComparison.lastWeek.totalHours}{t("common.timeUnits.h")}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8", marginTop: 2 }}>
                        {weekComparison.comparison.hoursDiff > 0 ? "+" : ""}
                        {weekComparison.comparison.hoursDiff}{t("common.timeUnits.h")} {t("stats.difference")}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              </View>
            )}

            {/* 2x2 Stats Table */}
            <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <StatCard
                  title={t("stats.totalHours")}
                  value={stats.totalHours === "--" ? "--" : `${stats.totalHours}${t("common.timeUnits.h")}`}
                  isDark={isDark}
                  animated={typeof stats.totalHours === "number"}
                  numericValue={typeof stats.totalHours === "number" ? stats.totalHours : undefined}
                  suffix={t("common.timeUnits.h")}
                />
                <StatCard
                  title={t("stats.dailyAvg")}
                  value={stats.dailyAvg === "--" ? "--" : `${stats.dailyAvg}${t("common.timeUnits.h")}`}
                  isDark={isDark}
                  animated={typeof stats.dailyAvg === "number"}
                  numericValue={typeof stats.dailyAvg === "number" ? stats.dailyAvg : undefined}
                  suffix={t("common.timeUnits.h")}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <StatCard
                  title={t("stats.peekDay")}
                  value={stats.peekDay === "--" ? "--" : localizeDayName(stats.peekDay)}
                  subtitle={stats.peekHours === "--" ? "--" : `${stats.peekHours}${t("common.timeUnits.h")}`}
                  isDark={isDark}
                />
                <StatCard
                  title={t("stats.unlocks")}
                  value={stats.unlocksTotal === "--" ? "--" : `${stats.unlocksTotal}`}
                  subtitle={stats.unlocksAvg === "--" ? "--" : `${stats.unlocksAvg}${t("stats.perDay")}`}
                  isDark={isDark}
                  animated={typeof stats.unlocksTotal === "number"}
                  numericValue={typeof stats.unlocksTotal === "number" ? stats.unlocksTotal : undefined}
                  suffix=""
                />
              </View>
            </View>

            {/* Bar Chart or Calendar */}
            <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
              <View
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
                }}
              >
                <BlurView intensity={isDark ? 20 : 35} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={isDark ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"] : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={isDark ? ["rgba(255, 255, 255, 0.06)", "transparent"] : ["rgba(255, 255, 255, 0.4)", "transparent"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.5 }}
                  style={[StyleSheet.absoluteFill, { height: "50%" }]}
                />
                <View style={{ padding: 20 }}>
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
                              {item.hours}{t("common.timeUnits.h")}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
                </View>
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
                    borderRadius: 20,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <BlurView intensity={isDark ? 20 : 35} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={isDark ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"] : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={isDark ? ["rgba(255, 255, 255, 0.06)", "transparent"] : ["rgba(255, 255, 255, 0.4)", "transparent"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.5 }}
                    style={[StyleSheet.absoluteFill, { height: "50%" }]}
                  />
                  <View style={{ padding: 8 }}>
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
