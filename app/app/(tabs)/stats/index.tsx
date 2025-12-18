import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  SafeAreaView,
} from "react-native-safe-area-context";

// Day Card Component
const DayCard = ({
  dayName,
  dateNumber,
  orbLevel,
  isDark,
}: {
  dayName: string;
  dateNumber: number;
  orbLevel: number;
  isDark: boolean;
}) => {
  // Select orb image based on level (1-5)
  const orbImages = [
    require("@/assets/images/orb1.png"),
    require("@/assets/images/orb2.png"),
    require("@/assets/images/orb3.jpg"),
    require("@/assets/images/orb4.jpg"),
    require("@/assets/images/orb5.jpg"),
  ];

  const orbImage = orbImages[Math.min(orbLevel - 1, 4)];

  return (
    <View
      style={{
        alignItems: "center",
        marginHorizontal: 3,
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
        borderRadius: 12,
        padding: 8,
        paddingVertical: 10,
        width: 48,
        borderWidth: 1.5,
        borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
        borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
        borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: "600",
          color: isDark ? "#9ca3af" : "#6b7280",
          marginBottom: 8,
          letterSpacing: 0.5,
        }}
      >
        {dayName.toUpperCase()}
      </Text>
      <Image
        source={orbImage}
        style={{ width: 32, height: 32, marginBottom: 6 }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontSize: 13,
          fontWeight: "bold",
          color: isDark ? "#ffffff" : "#111827",
        }}
      >
        {dateNumber}
      </Text>
    </View>
  );
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  isDark,
}: {
  title: string;
  value: string;
  subtitle?: string;
  isDark: boolean;
}) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
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
          fontSize: 11,
          fontWeight: "600",
          color: isDark ? "#9ca3af" : "#6b7280",
          marginBottom: 8,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: isDark ? "#ffffff" : "#111827",
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 12,
            color: isDark ? "#9ca3af" : "#6b7280",
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

// Bar Chart Component
const BarChart = ({
  data,
  isDark,
}: {
  data: { day: string; hours: number }[];
  isDark: boolean;
}) => {
  const maxHours = Math.max(...data.map((d) => d.hours));

  return (
    <View
      style={{
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1.5,
        borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
        borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
        borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          color: isDark ? "#ffffff" : "#111827",
          marginBottom: 20,
        }}
      >
        Stats Per Day
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          height: 150,
        }}
      >
        {data.map((item, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              alignItems: "center",
              marginHorizontal: 4,
            }}
          >
            <View
              style={{
                width: "100%",
                height: (item.hours / maxHours) * 120,
                backgroundColor: isDark ? "#ffffff" : "#111827",
                borderRadius: 6,
                marginBottom: 8,
              }}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              {item.day}
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: isDark ? "#64748b" : "#94a3b8",
              }}
            >
              {item.hours}h
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// App Usage Item Component
const AppUsageItem = ({
  appName,
  duration,
  percentage,
  iconUrl,
  isDark,
}: {
  appName: string;
  duration: string;
  percentage: number;
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
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Image
          source={iconUrl}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
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
            fontSize: 15,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {duration}
        </Text>
      </View>
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: isDark ? "#ffffff" : "#111827",
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
};

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [weekOffset, setWeekOffset] = useState(0);

  // Generate week dates
  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

    const dates = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push({
        dayName: dayNames[date.getDay()],
        dateNumber: date.getDate(),
        orbLevel: Math.floor(Math.random() * 5) + 1, // Random 1-5
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Dummy data
  const stats = {
    totalHours: 24.5,
    dailyAvg: 3.5,
    peekDay: "Wed",
    peekHours: 5.2,
    pickupsTotal: 842,
    pickupsAvg: 120,
  };

  const chartData = [
    { day: "Sun", hours: 2.5 },
    { day: "Mon", hours: 4.2 },
    { day: "Tue", hours: 3.8 },
    { day: "Wed", hours: 5.2 },
    { day: "Thu", hours: 3.1 },
    { day: "Fri", hours: 4.5 },
    { day: "Sat", hours: 1.2 },
  ];

  // Convert duration to minutes for percentage calculation
  const appsData = [
    { id: "1", appName: "Instagram", duration: "8h 34m", minutes: 514 },
    { id: "2", appName: "YouTube", duration: "6h 45m", minutes: 405 },
    { id: "3", appName: "TikTok", duration: "4h 12m", minutes: 252 },
    { id: "4", appName: "Twitter", duration: "3h 20m", minutes: 200 },
    { id: "5", appName: "Facebook", duration: "1h 44m", minutes: 104 },
  ];

  // Calculate percentages based on the highest usage
  const maxMinutes = Math.max(...appsData.map(app => app.minutes));
  const appsUsage = appsData.map(app => ({
    ...app,
    percentage: (app.minutes / maxMinutes) * 100,
    iconUrl: require("@/assets/images/splash-icon.png"),
  }));

  const getWeekLabel = () => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === -1) return "Last Week";
    if (weekOffset > 0) return `${weekOffset} Week${weekOffset > 1 ? 's' : ''} Ahead`;
    return `${Math.abs(weekOffset)} Week${Math.abs(weekOffset) > 1 ? 's' : ''} Ago`;
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Week Navigation */}
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
          <TouchableOpacity
            onPress={() => setWeekOffset(weekOffset - 1)}
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
            <ChevronLeft size={22} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2} />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              LockIn Report
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#9ca3af" : "#6b7280",
                marginTop: 4,
              }}
            >
              {getWeekLabel()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setWeekOffset(weekOffset + 1)}
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
            <ChevronRight size={22} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 7 Days Cards */}
        <View style={{ marginTop: 20, marginBottom: 24, alignItems: "center" }}>
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
              />
            ))}
          </View>
        </View>

        {/* 2x2 Stats Table */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <StatCard
              title="TOTAL HOURS"
              value={`${stats.totalHours}h`}
              isDark={isDark}
            />
            <StatCard
              title="DAILY AVG"
              value={`${stats.dailyAvg}h`}
              isDark={isDark}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatCard
              title="PEEK DAY"
              value={stats.peekDay}
              subtitle={`${stats.peekHours}h`}
              isDark={isDark}
            />
            <StatCard
              title="PICKUPS"
              value={`${stats.pickupsTotal}`}
              subtitle={`${stats.pickupsAvg}/day`}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Bar Chart */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <BarChart data={chartData} isDark={isDark} />
        </View>

        {/* App Usage List */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: 16,
            }}
          >
            Total Time Per App
          </Text>

          {appsUsage.map((app) => (
            <AppUsageItem
              key={app.id}
              appName={app.appName}
              duration={app.duration}
              percentage={app.percentage}
              iconUrl={app.iconUrl}
              isDark={isDark}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
