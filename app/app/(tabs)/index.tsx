import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
} from "react-native";
import { HelpCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTranslation } from "react-i18next";
import {
  getTodayUsageStats,
  calculateHealthScore,
  getOrbLevel,
  initializeTracking,
  getDailyUsageForWeek,
} from "@/lib/usageTracking";
import { fetchAppIcons, getAppIcon } from "@/lib/iconCache";
import { useBlocking } from "@/context/BlockingContext";
import { useEarnedTime } from "@/context/EarnedTimeContext";
import AnimatedOrb from "@/components/AnimatedOrb";
import { HelpCarousel } from "@/components/modals/HelpCarousel";
import { getHelpCards } from "@/lib/helpContent";
import { ThemedBackground } from "@/components/ui/ThemedBackground";
import { TodaysProgress } from "@/components/TodaysProgress";
import {
  HealthProgressBar,
  QuickStatsRow,
  ActiveFocusSession,
  AppUsageList,
  QuickActionMenu,
} from "@/components/home";

const PLANET_SIZE = 160;

export default function HomeScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { streak: earnedTimeStreak } = useEarnedTime();
  const [refreshing, setRefreshing] = useState(false);
  const [healthScore, setHealthScore] = useState(75);
  const [totalScreenTime, setTotalScreenTime] = useState(0);
  const [pickups, setPickups] = useState(0);
  const [orbLevel, setOrbLevel] = useState(3);
  const [previousOrbLevel, setPreviousOrbLevel] = useState(3);
  const [averageScreenTime, setAverageScreenTime] = useState(0);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [appsUsage, setAppsUsage] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [showHelpCarousel, setShowHelpCarousel] = useState(false);

  // Animation values for orb
  const planetScale = useRef(new Animated.Value(1)).current;
  const planetOpacity = useRef(new Animated.Value(1)).current;

  // Animation values for quick menu (6 items max: up to 4 favorites + 2 static)
  const icon1Anim = useState(new Animated.Value(0))[0];
  const icon2Anim = useState(new Animated.Value(0))[0];
  const icon3Anim = useState(new Animated.Value(0))[0];
  const icon4Anim = useState(new Animated.Value(0))[0];
  const icon5Anim = useState(new Animated.Value(0))[0];
  const icon6Anim = useState(new Animated.Value(0))[0];

  const text1Anim = useState(new Animated.Value(0))[0];
  const text2Anim = useState(new Animated.Value(0))[0];
  const text3Anim = useState(new Animated.Value(0))[0];
  const text4Anim = useState(new Animated.Value(0))[0];
  const text5Anim = useState(new Animated.Value(0))[0];
  const text6Anim = useState(new Animated.Value(0))[0];

  const { focusSession, blockedApps } = useBlocking();

  // Animate planet change
  useEffect(() => {
    if (orbLevel !== previousOrbLevel) {
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
      Animated.stagger(40, [
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
        Animated.parallel([
          Animated.timing(text5Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(icon5Anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(text6Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(icon6Anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start(() => setQuickMenuOpen(false));
    } else {
      setQuickMenuOpen(true);
      Animated.stagger(50, [
        Animated.parallel([
          Animated.spring(icon6Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(text6Anim, { toValue: 1, duration: 200, delay: 50, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(icon5Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(text5Anim, { toValue: 1, duration: 200, delay: 50, useNativeDriver: true }),
        ]),
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


  // Load weekly average
  const loadWeeklyAverage = async () => {
    try {
      const dailyStats = await getDailyUsageForWeek(0);
      const daysWithData = dailyStats.filter((d) => d.hours > 0);

      if (daysWithData.length > 0) {
        const totalHours = daysWithData.reduce((sum, d) => sum + d.hours, 0);
        const avgHours = totalHours / daysWithData.length;
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

      const score = calculateHealthScore(stats.totalScreenTime, stats.unlocks);
      setHealthScore(score);
      setTotalScreenTime(stats.totalScreenTime);
      setPickups(stats.unlocks);
      setOrbLevel(getOrbLevel(score));

      if (stats.apps && stats.apps.length > 0) {
        const formattedApps = stats.apps
          .sort((a, b) => b.timeInForeground - a.timeInForeground)
          .slice(0, 6)
          .map((app) => ({
            ...app,
            usageTime: app.timeInForeground,
            iconUrl: getAppIcon(app.packageName) || app.iconUrl || null,
          }));
        setAppsUsage(formattedApps);

        // Fetch icons in background and update when ready
        fetchAppIcons().then(() => {
          const updatedApps = formattedApps.map(app => ({
            ...app,
            iconUrl: getAppIcon(app.packageName) || app.iconUrl || null,
          }));
          setAppsUsage(updatedApps);
        });
      }

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
    if (blockedApps.some((app) => app.packageName === packageName)) {
      return true;
    }
    if (focusSession && focusSession.blockedApps.includes(packageName)) {
      return true;
    }
    return false;
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
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HelpCircle
                size={24}
                color={isDark ? "#ffffff" : "#111827"}
                strokeWidth={2.5}
              />
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

          {/* Health Progress Bar */}
          <HealthProgressBar healthScore={healthScore} isDark={isDark} />

          {/* Quick Stats Row */}
          <QuickStatsRow
            streak={earnedTimeStreak.currentStreak}
            totalScreenTime={totalScreenTime}
            averageScreenTime={averageScreenTime}
            isDark={isDark}
          />

          {/* Today's Progress Card */}
          <TodaysProgress isDark={isDark} />

          {/* Active Focus Session */}
          {focusSession && <ActiveFocusSession focusSession={focusSession} />}

          {/* App Usage List */}
          <AppUsageList
            appsUsage={appsUsage}
            isLoading={isLoadingApps}
            isAppBlocked={isAppBlocked}
            isDark={isDark}
          />
        </ScrollView>

        {/* Quick Action Menu */}
        <QuickActionMenu
          isOpen={quickMenuOpen}
          onToggle={toggleMenu}
          iconAnims={[icon1Anim, icon2Anim, icon3Anim, icon4Anim, icon5Anim, icon6Anim]}
          textAnims={[text1Anim, text2Anim, text3Anim, text4Anim, text5Anim, text6Anim]}
        />

        {/* Help Carousel Modal */}
        <HelpCarousel
          visible={showHelpCarousel}
          cards={getHelpCards('home', t)}
          onClose={() => setShowHelpCarousel(false)}
        />
      </SafeAreaView>
    </ThemedBackground>
  );
}
