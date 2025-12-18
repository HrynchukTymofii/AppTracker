import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  RefreshControl,
} from "react-native";
import { HelpCircle, Lock } from "lucide-react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import Svg, { Circle } from "react-native-svg";
import {
  getTodayUsageStats,
  formatDuration,
  calculateHealthScore,
  getOrbLevel,
  initializeTracking,
} from "@/lib/usageTracking";
import { useBlocking } from "@/context/BlockingContext";

// Circular Progress Component
const CircularProgress = ({
  size = 70,
  strokeWidth = 6,
  progress = 0,
  isDark,
}: {
  size?: number;
  strokeWidth?: number;
  progress: number;
  isDark: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <Circle
          stroke={isDark ? "#ffffff" : "#111827"}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Score in the middle */}
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
            fontSize: 16,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {progress}
        </Text>
      </View>
    </View>
  );
};

// Date Item Component
const DateItem = ({
  dayName,
  score,
  isToday,
  isDark,
}: {
  dayName: string;
  score: number;
  isToday: boolean;
  isDark: boolean;
}) => {
  return (
    <View
      style={{
        alignItems: "center",
        marginRight: 12,
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
        borderRadius: 16,
        padding: 12,
        paddingVertical: 16,
        borderWidth: 1.5,
        borderColor: isToday
          ? isDark ? "#ffffff" : "#111827"
          : isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
        borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
        borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: isDark ? "#9ca3af" : "#6b7280",
          marginBottom: 12,
          letterSpacing: 0.5,
        }}
      >
        {dayName.toUpperCase()}
      </Text>
      <CircularProgress progress={score} isDark={isDark} size={70} strokeWidth={6} />
    </View>
  );
};

// App Usage Item Component
const AppUsageItem = ({
  appName,
  duration,
  iconUrl,
  isDark,
}: {
  appName: string;
  duration: string;
  iconUrl: any;
  isDark: boolean;
}) => {
  return (
    <View
      style={{
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      }}
    >
      <Image
        source={iconUrl}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          marginRight: 12,
        }}
        resizeMode="cover"
      />
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: "600",
          color: isDark ? "#ffffff" : "#111827",
        }}
      >
        {appName}
      </Text>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          color: isDark ? "#ffffff" : "#111827",
        }}
      >
        {duration}
      </Text>
    </View>
  );
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [appsUsage, setAppsUsage] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthScore, setHealthScore] = useState(75);
  const [totalScreenTime, setTotalScreenTime] = useState(0);
  const [pickups, setPickups] = useState(0);
  const [orbLevel, setOrbLevel] = useState(3);

  const { focusSession, blockedApps } = useBlocking();

  // Generate dates with scores based on day of week patterns
  const today = new Date();
  const dates = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = -6; i <= 6; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    // Generate consistent scores based on date (not random)
    const seed = date.getDate() + date.getMonth() * 31;
    const score = i === 0 ? healthScore : 40 + (seed % 60);
    dates.push({
      dayName: dayNames[date.getDay()],
      score: Math.round(score),
      isToday: i === 0,
    });
  }

  // Fetch usage data
  const fetchUsageData = useCallback(async () => {
    try {
      setIsLoadingApps(true);
      await initializeTracking();
      const stats = await getTodayUsageStats();

      // Calculate health score
      const score = calculateHealthScore(stats.totalScreenTime, stats.pickups);
      setHealthScore(score);
      setTotalScreenTime(stats.totalScreenTime);
      setPickups(stats.pickups);
      setOrbLevel(getOrbLevel(score));

      // Format apps for display
      const formattedApps = stats.apps.map((app, index) => ({
        id: app.packageName || index.toString(),
        appName: app.appName,
        duration: formatDuration(app.timeInForeground),
        iconUrl: require("@/assets/images/splash-icon.png"),
        isBlocked: blockedApps.some(
          (b) => b.packageName === app.packageName && b.isBlocked
        ),
      }));

      setAppsUsage(formattedApps);
    } catch (error) {
      console.error("Error fetching usage data:", error);
    } finally {
      setIsLoadingApps(false);
    }
  }, [blockedApps]);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsageData();
    setRefreshing(false);
  }, [fetchUsageData]);

  // Get orb image based on level
  const getOrbImage = () => {
    const orbImages = [
      require("@/assets/images/orb1.png"),
      require("@/assets/images/orb2.png"),
      require("@/assets/images/orb3.jpg"),
      require("@/assets/images/orb4.jpg"),
      require("@/assets/images/orb5.jpg"),
    ];
    return orbImages[Math.min(orbLevel - 1, 4)];
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
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
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            LockIn
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HelpCircle size={22} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Active Focus Session Banner */}
        {focusSession && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 16,
              backgroundColor: "#ef4444",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Lock size={20} color="#ffffff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>
                Focus Mode Active
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                {focusSession.blockedApps.length} apps blocked
              </Text>
            </View>
          </View>
        )}

        {/* Dates Row with Circular Progress */}
        <View style={{ paddingLeft: 20, marginBottom: 32 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {dates.map((item, index) => (
              <DateItem
                key={index}
                dayName={item.dayName}
                score={item.score}
                isToday={item.isToday}
                isDark={isDark}
              />
            ))}
          </ScrollView>
        </View>

        {/* Main Orb Section */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 32,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
            borderRadius: 24,
            padding: 32,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 10,
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
            borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
            borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Orb Image */}
          <Image
            source={getOrbImage()}
            style={{ width: 200, height: 200, marginBottom: 24 }}
            resizeMode="contain"
          />

          {/* Health Score */}
          <Text
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: 16,
            }}
          >
            {healthScore}
          </Text>

          {/* Progress Bar */}
          <View
            style={{
              width: "100%",
              height: 12,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              borderRadius: 6,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${healthScore}%`,
                backgroundColor: isDark ? "#ffffff" : "#111827",
                borderRadius: 6,
              }}
            />
          </View>

          {/* Health Label */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              letterSpacing: 1,
            }}
          >
            HEALTH
          </Text>
        </View>

        {/* Apps Usage List */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: 16,
            }}
          >
            App Usage Today
          </Text>

          {isLoadingApps ? (
            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                borderRadius: 12,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Loading apps...
              </Text>
            </View>
          ) : (
            appsUsage.map((app) => (
              <AppUsageItem
                key={app.id}
                appName={app.appName}
                duration={app.duration}
                iconUrl={app.iconUrl}
                isDark={isDark}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
