import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Modal,
} from "react-native";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, HelpCircle } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import {
  getWeekUsageStatsWithOffset,
  getDailyUsageForWeek,
  formatDuration,
  calculateHealthScore,
  getOrbLevel,
  getTodayUsageStats,
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

// Local app icons mapping
const APP_ICONS: { [key: string]: any } = {
  instagram: require("@/assets/icons/instagram.png"),
  youtube: require("@/assets/icons/youtube.png"),
  tiktok: require("@/assets/icons/tiktok.png"),
  musically: require("@/assets/icons/tiktok.png"),
  facebook: require("@/assets/icons/facebook.png"),
  telegram: require("@/assets/icons/telegram.png"),
  pinterest: require("@/assets/icons/pinterest.png"),
  linkedin: require("@/assets/icons/linkedin.png"),
  twitter: require("@/assets/icons/x.png"),
  x: require("@/assets/icons/x.png"),
};

// Get local icon for app based on package name or app name
const getLocalIcon = (packageName: string, appName: string): any | null => {
  const packageLower = packageName.toLowerCase();
  const nameLower = appName.toLowerCase();

  for (const [key, icon] of Object.entries(APP_ICONS)) {
    if (packageLower.includes(key) || nameLower.includes(key)) {
      return icon;
    }
  }
  return null;
};

// Day Card Component
const DayCard = ({
  dayName,
  dateNumber,
  orbLevel,
  isDark,
  hasData = true,
}: {
  dayName: string;
  dateNumber: number;
  orbLevel: number;
  isDark: boolean;
  hasData?: boolean;
}) => {
  const { t } = useTranslation();

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
        backgroundColor: hasData
          ? (isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff")
          : (isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"),
        borderRadius: 12,
        padding: 8,
        paddingVertical: 10,
        width: 48,
        borderWidth: 1.5,
        borderColor: hasData
          ? (isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)")
          : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)"),
        borderTopColor: hasData
          ? (isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)")
          : "transparent",
        borderBottomColor: hasData
          ? (isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)")
          : "transparent",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: hasData ? 0.1 : 0.02,
        shadowRadius: 8,
        elevation: hasData ? 4 : 1,
        opacity: hasData ? 1 : 0.4,
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
      {hasData ? (
        <>
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
        </>
      ) : (
        <>
          <HelpCircle
            size={32}
            color={isDark ? "#4b5563" : "#9ca3af"}
            style={{ marginBottom: 6 }}
          />
          <Text
            style={{
              fontSize: 10,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            {t('stats.noData')}
          </Text>
        </>
      )}
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
  // Handle both base64 URIs and local require() images
  const imageSource = typeof iconUrl === 'string'
    ? { uri: iconUrl }
    : iconUrl;

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
          source={imageSource}
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

// Get heatmap color based on health score
const getHeatmapColor = (healthScore: number, isDark: boolean) => {
  if (healthScore >= 80) {
    return isDark ? "#22c55e" : "#16a34a"; // Green - Excellent
  } else if (healthScore >= 60) {
    return isDark ? "#84cc16" : "#65a30d"; // Light green - Good
  } else if (healthScore >= 40) {
    return isDark ? "#facc15" : "#ca8a04"; // Yellow - Average
  } else if (healthScore >= 20) {
    return isDark ? "#f97316" : "#ea580c"; // Orange - Poor
  } else {
    return isDark ? "#ef4444" : "#dc2626"; // Red - Very poor
  }
};

// Calendar Heatmap Component
const CalendarHeatmap = ({
  data,
  isDark,
  onDayPress,
}: {
  data: any[];
  isDark: boolean;
  onDayPress: (day: any) => void;
}) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("window");
  const cellSize = (width - 80) / 7;

  // Organize data by month
  const organizeDataByMonth = () => {
    const months: { [key: string]: any[] } = {};
    data.forEach((day) => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(day);
    });
    return months;
  };

  const monthsData = organizeDataByMonth();
  const sortedMonthKeys = Object.keys(monthsData).sort().reverse().slice(0, 3); // Show last 3 months

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const generateMonthGrid = (monthKey: string, daysInMonth: any[]) => {
    const [year, month] = monthKey.split("-");
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    const daysInMonthCount = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const dataMap = new Map(daysInMonth.map((d) => [d.date, d]));

    const grid = [];
    let currentWeek = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(
        <View
          key={`empty-start-${i}`}
          style={{
            width: cellSize - 4,
            height: cellSize - 4,
            margin: 2,
          }}
        />
      );
    }

    for (let day = 1; day <= daysInMonthCount; day++) {
      const dateStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
      const dayData = dataMap.get(dateStr);

      if (dayData) {
        const bgColor = getHeatmapColor(dayData.health_score, isDark);
        currentWeek.push(
          <TouchableOpacity
            key={dateStr}
            onPress={() => onDayPress(dayData)}
            activeOpacity={0.7}
            style={{
              width: cellSize - 4,
              height: cellSize - 4,
              margin: 2,
              backgroundColor: bgColor,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#ffffff" }}>{day}</Text>
          </TouchableOpacity>
        );
      } else {
        currentWeek.push(
          <View
            key={`empty-${dateStr}`}
            style={{
              width: cellSize - 4,
              height: cellSize - 4,
              margin: 2,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 6,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            }}
          />
        );
      }

      if (currentWeek.length === 7) {
        grid.push(
          <View key={`week-${grid.length}`} style={{ flexDirection: "row", justifyContent: "center" }}>
            {currentWeek}
          </View>
        );
        currentWeek = [];
      }
    }

    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(
        <View
          key={`empty-end-${currentWeek.length}`}
          style={{
            width: cellSize - 4,
            height: cellSize - 4,
            margin: 2,
          }}
        />
      );
    }

    if (currentWeek.length > 0) {
      grid.push(
        <View key={`week-${grid.length}`} style={{ flexDirection: "row", justifyContent: "center" }}>
          {currentWeek}
        </View>
      );
    }

    return grid;
  };

  return (
    <View>
      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 11, color: isDark ? "#9ca3af" : "#6b7280" }}>{t('stats.health.label')}</Text>
        {[
          { label: t('stats.health.poor'), color: isDark ? "#ef4444" : "#dc2626" },
          { label: t('stats.health.low'), color: isDark ? "#f97316" : "#ea580c" },
          { label: t('stats.health.avg'), color: isDark ? "#facc15" : "#ca8a04" },
          { label: t('stats.health.good'), color: isDark ? "#84cc16" : "#65a30d" },
          { label: t('stats.health.great'), color: isDark ? "#22c55e" : "#16a34a" },
        ].map((item) => (
          <View key={item.label} style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                backgroundColor: item.color,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 10, color: isDark ? "#9ca3af" : "#6b7280" }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Day Names */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 8 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <View key={index} style={{ width: cellSize - 4, margin: 2, alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {data.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>{t('stats.noUsageData')}</Text>
        </View>
      ) : (
        sortedMonthKeys.map((monthKey) => (
          <View key={monthKey} style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {getMonthLabel(monthKey)}
            </Text>
            {generateMonthGrid(monthKey, monthsData[monthKey])}
          </View>
        ))
      )}
    </View>
  );
};

// Day Tooltip Component
const DayTooltip = ({
  visible,
  day,
  isDark,
  onClose,
}: {
  visible: boolean;
  day: any;
  isDark: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();

  if (!visible || !day) return null;

  const dateObj = new Date(day.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const orbImages = [
    require("@/assets/images/orb1.png"),
    require("@/assets/images/orb2.png"),
    require("@/assets/images/orb3.jpg"),
    require("@/assets/images/orb4.jpg"),
    require("@/assets/images/orb5.jpg"),
  ];
  const orbImage = orbImages[Math.min(day.orb_level - 1, 4)];

  // Parse apps data and get top 3
  const appsData = JSON.parse(day.apps_data || "[]");
  const top3Apps = appsData.slice(0, 3);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            borderRadius: 20,
            padding: 24,
            marginHorizontal: 20,
            maxWidth: 400,
            width: "90%",
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 15,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <Text style={{ fontSize: 18, color: isDark ? "#ffffff" : "#111827", fontWeight: "bold" }}>×</Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Image source={orbImage} style={{ width: 60, height: 60, marginBottom: 12 }} resizeMode="contain" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
                textAlign: "center",
              }}
            >
              {formattedDate}
            </Text>
          </View>

          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>{t('stats.healthScore')}</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}>
                {day.health_score}/100
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>{t('stats.screenTime')}</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}>
                {formatDuration(day.total_screen_time)}
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>{t('stats.pickups')}</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}>
                {day.pickups}
              </Text>
            </View>
          </View>

          {top3Apps.length > 0 && (
            <>
              <View
                style={{
                  height: 1,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                  marginVertical: 12,
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginBottom: 8,
                }}
              >
                {t('stats.topApps')}
              </Text>
              {top3Apps.map((app: any, index: number) => {
                const localIcon = getLocalIcon(app.packageName || '', app.appName);
                const iconSource = localIcon || (app.iconUrl ? { uri: app.iconUrl } : null);
                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                      borderRadius: 8,
                    }}
                  >
                    {iconSource && (
                      <Image
                        source={iconSource}
                        style={{ width: 28, height: 28, borderRadius: 6, marginRight: 10 }}
                      />
                    )}
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: isDark ? "#ffffff" : "#111827",
                      }}
                    >
                      {app.appName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: isDark ? "#9ca3af" : "#6b7280",
                      }}
                    >
                      {formatDuration(app.timeInForeground)}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function StatsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [weekOffset, setWeekOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoPrev, setCanGoPrev] = useState(true);
  const [canGoNext, setCanGoNext] = useState(false);
  const [hasCurrentWeekData, setHasCurrentWeekData] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any[]>([]);

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

  // Initialize database and backfill historical data
  useEffect(() => {
    const initDatabase = async () => {
      await initUsageDatabase();

      // Backfill the last 7 days of data into the database
      try {
        const weekStats = await getWeekUsageStatsWithOffset(0);
        const dailyStats = await getDailyUsageForWeek(0);

        // Save each day from the last week
        for (let i = 0; i < 7; i++) {
          const dayData = dailyStats[i];
          if (dayData && dayData.hours !== undefined) {
            const date = new Date();
            date.setDate(date.getDate() - date.getDay() + i);
            date.setHours(0, 0, 0, 0);

            // Don't save future dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date <= today) {
              const dateStr = formatDate(date);
              const healthScore = calculateHealthScore(
                dayData.hours * 60 * 60 * 1000,
                Math.round(weekStats.pickups / 7)
              );
              const orbLevel = getOrbLevel(healthScore);

              // Get apps data for this day (use weekly data as approximation)
              await saveDailyUsage(
                dateStr,
                dayData.hours * 60 * 60 * 1000,
                Math.round(weekStats.pickups / 7),
                healthScore,
                orbLevel,
                weekStats.apps
              );
            }
          }
        }
        console.log('Database backfilled with last week data');
      } catch (error) {
        console.error('Error backfilling database:', error);
      }
    };

    initDatabase();
  }, []);

  // Load calendar data when calendar view is shown
  useEffect(() => {
    if (showCalendar) {
      loadCalendarData();
    }
  }, [showCalendar]);

  const loadCalendarData = async () => {
    try {
      const data = await getAllDatesWithData();
      setCalendarData(data);
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
        console.error('Error saving today data:', error);
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

      // Check if this week has data in DB
      const { startDate, endDate } = getWeekDateRange(weekOffset);
      const hasData = await hasDataForRange(startDate, endDate);
      setHasCurrentWeekData(hasData);

      // Check navigation availability
      // Previous: Only allow if there's ANY data in previous week (even 1 day)
      const prevWeekRange = getWeekDateRange(weekOffset - 1);
      const hasPrevData = await hasDataForRange(prevWeekRange.startDate, prevWeekRange.endDate);
      setCanGoPrev(hasPrevData);

      // Next: Allow going forward up to one week ahead (next week), no further
      // weekOffset < 1 means we can go from week 0 (current) to week 1 (next), but not beyond
      setCanGoNext(weekOffset < 1);

      // Get week usage stats (will use DB for past weeks if available)
      const weekStats = await getWeekUsageStatsWithOffset(weekOffset);
      const dailyStats = await getDailyUsageForWeek(weekOffset);

      // Calculate stats - only use real data, no fake defaults
      const hasRealData = weekStats.totalScreenTime > 0 || weekStats.pickups > 0 || dailyStats.some(d => d.hours > 0);

      // If no data for this week, show "--" instead of 0
      if (!hasData || !hasRealData) {
        setStats({
          totalHours: "--",
          dailyAvg: "--",
          peekDay: "--",
          peekHours: "--",
          pickupsTotal: "--",
          pickupsAvg: "--",
        });
      } else {
        const totalHours = weekStats.totalScreenTime / (1000 * 60 * 60);
        const dailyAvg = totalHours / 7;
        const peekDayData = dailyStats.reduce((max, curr) => curr.hours > max.hours ? curr : max, dailyStats[0] || { day: 'Mon', hours: 0 });

        setStats({
          totalHours: Math.round(totalHours * 10) / 10,
          dailyAvg: Math.round(dailyAvg * 10) / 10,
          peekDay: peekDayData?.day || '--',
          peekHours: Math.round((peekDayData?.hours || 0) * 10) / 10,
          pickupsTotal: weekStats.pickups,
          pickupsAvg: Math.round(weekStats.pickups / 7),
        });
      }

      // Set chart data
      setChartData(dailyStats);

      // Format apps usage
      const maxTime = Math.max(...weekStats.apps.map(a => a.timeInForeground), 1);
      const formattedApps = weekStats.apps.map((app, index) => {
        // Prefer local icon, then device icon, then fallback
        const localIcon = getLocalIcon(app.packageName || '', app.appName);
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

      // Generate week dates with orb levels and data availability
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (weekOffset * 7));

      const dates = [];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      // Get stored data for this week from DB
      const storedWeekData = await getWeekUsage(startDate, endDate);
      const storedDataMap = new Map(storedWeekData.map(d => [d.date, d]));

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = formatDate(date);
        const dayData = dailyStats[i];

        // Don't show data for future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        const isFutureDate = date > today;

        // Check if we have data for this day
        // A day has data if it exists in our records (even with 0 hours) AND is not in the future
        const storedDay = storedDataMap.get(dateStr);
        const dayHasData = !isFutureDate && !!(storedDay || (dayData !== undefined && dayData !== null));

        // Calculate orb level based on actual hours (no fake defaults)
        // Only calculate if we have real data, otherwise use default values
        const actualHours = (dayData?.hours || 0) * 60 * 60 * 1000;
        const actualPickups = hasRealData ? Math.round(weekStats.pickups / 7) : 0;
        const healthScore = dayHasData && hasRealData
          ? calculateHealthScore(actualHours, actualPickups)
          : 50; // Default neutral score for days without data
        dates.push({
          dayName: dayNames[date.getDay()],
          dateNumber: date.getDate(),
          orbLevel: getOrbLevel(healthScore),
          hasData: dayHasData,
        });
      }
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
    if (weekOffset === 0) return t('stats.thisWeek');
    if (weekOffset === -1) return t('stats.lastWeek');
    if (weekOffset > 0) return t('stats.weeksAhead', { count: weekOffset });
    return t('stats.weeksAgo', { count: Math.abs(weekOffset) });
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
        {isLoading && !refreshing ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 100 }}>
            <Text style={{ fontSize: 16, color: isDark ? "#9ca3af" : "#6b7280" }}>
              {t('stats.loadingStats')}
            </Text>
          </View>
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
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => canGoPrev && setWeekOffset(weekOffset - 1)}
            disabled={!canGoPrev}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
              alignItems: "center",
              justifyContent: "center",
              opacity: canGoPrev ? 1 : 0.3,
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
              {t('stats.title')}
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
            onPress={() => canGoNext && setWeekOffset(weekOffset + 1)}
            disabled={!canGoNext}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
              alignItems: "center",
              justifyContent: "center",
              opacity: canGoNext ? 1 : 0.3,
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
                hasData={item.hasData}
              />
            ))}
          </View>
        </View>

        {/* 2x2 Stats Table */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <StatCard
              title={t('stats.totalHours')}
              value={stats.totalHours === "--" ? "--" : `${stats.totalHours}h`}
              isDark={isDark}
            />
            <StatCard
              title={t('stats.dailyAvg')}
              value={stats.dailyAvg === "--" ? "--" : `${stats.dailyAvg}h`}
              isDark={isDark}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatCard
              title={t('stats.peekDay')}
              value={stats.peekDay}
              subtitle={stats.peekHours === "--" ? "--" : `${stats.peekHours}h`}
              isDark={isDark}
            />
            <StatCard
              title={t('stats.pickups')}
              value={stats.pickupsTotal === "--" ? "--" : `${stats.pickupsTotal}`}
              subtitle={stats.pickupsAvg === "--" ? "--" : `${stats.pickupsAvg}${t('stats.perDay')}`}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Bar Chart or Calendar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  {showCalendar ? t('stats.usageCalendar') : t('stats.statsPerDay')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCalendar(!showCalendar)}
                  activeOpacity={0.7}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: showCalendar
                      ? (isDark ? "#22c55e" : "#16a34a")
                      : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CalendarIcon
                    size={18}
                    color={showCalendar ? "#ffffff" : (isDark ? "#ffffff" : "#111827")}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>

              {showCalendar ? (
                <CalendarHeatmap
                  data={calendarData}
                  isDark={isDark}
                  onDayPress={(day) => setSelectedDay(day)}
                />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    height: 150,
                  }}
                >
                  {chartData.map((item, index) => {
                    const maxHours = Math.max(...chartData.map((d) => d.hours));
                    return (
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
                    );
                  })}
                </View>
              )}
            </View>
          </View>

        {/* App Usage List */}
        {hasCurrentWeekData && appsUsage.length > 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 16,
              }}
            >
              {t('stats.totalTimePerApp')}
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
    </SafeAreaView>
  );
}
