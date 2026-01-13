import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { getAllPlanDates, getTaskCount } from "@/lib/studyPlanStorage";
import { useTranslation } from "react-i18next";

export default function CalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Localized day names
  const dayNames = [
    t("common.dayNames.sun"),
    t("common.dayNames.mon"),
    t("common.dayNames.tue"),
    t("common.dayNames.wed"),
    t("common.dayNames.thu"),
    t("common.dayNames.fri"),
    t("common.dayNames.sat"),
  ];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [satDate, setSatDate] = useState<string | null>(null);
  const [planDates, setPlanDates] = useState<string[]>([]);
  const [taskCounts, setTaskCounts] = useState<Map<string, { total: number; completed: number }>>(new Map());

  // Load SAT date from SecureStore
  useEffect(() => {
    loadSatDate();
  }, []);

  // Load plan dates when screen is focused or month changes
  useFocusEffect(
    React.useCallback(() => {
      loadPlanDates();
    }, [currentMonth])
  );

  const loadPlanDates = async () => {
    try {
      const dates = await getAllPlanDates();
      setPlanDates(dates);

      // Load task counts for visible dates in current month
      const counts = new Map<string, { total: number; completed: number }>();
      for (const dateKey of dates) {
        const count = await getTaskCount(dateKey);
        counts.set(dateKey, count);
      }
      setTaskCounts(counts);
    } catch (error) {
      console.error("Failed to load plan dates:", error);
    }
  };

  const loadSatDate = async () => {
    try {
      const stored = await SecureStore.getItemAsync("onboardingAnswers");
      if (stored) {
        const answers = JSON.parse(stored);
        setSatDate(answers.satDate || null);
      }
    } catch (error) {
      console.error("Failed to load SAT date:", error);
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isSatDate = (date: Date) => {
    if (!satDate) return false;
    const sat = new Date(satDate);
    return isSameDay(date, sat);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(selected);
    const dateStr = selected.toISOString().split("T")[0];
    router.push(`/calendar/day/${dateStr}` as any);
  };

  // Generate calendar grid
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={{ width: "14.28%", aspectRatio: 1 }} />);
    }

    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isCurrentDay = isToday(date);
      const isSATDay = isSatDate(date);
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      // Check if this date has tasks
      const dateKey = date.toISOString().split("T")[0];
      const taskCount = taskCounts.get(dateKey);
      const hasTasks = taskCount && taskCount.total > 0;

      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => handleDateClick(day)}
          style={{
            width: "14.28%",
            aspectRatio: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 4,
            borderRadius: 12,
            backgroundColor: isSelected
              ? "#06B6D4"
              : isSATDay
              ? "#f59e0b"
              : isDark
              ? "#1e293b"
              : "#ffffff",
            borderWidth: isCurrentDay ? 2 : 0,
            borderColor: "#06B6D4",
            paddingBottom: 10
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: isSATDay || isSelected || isCurrentDay ? "700" : "400",
              color: isSelected || isSATDay ? "#ffffff" : isDark ? "#ffffff" : "#1f2937",
            }}
          >
            {day}
          </Text>
          {hasTasks && !isSATDay && (
            <View
              style={{
                position: "absolute",
                top: 1,
                right: 1,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: isSelected ? "#ffffff" : "#06B6D4",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: isSelected ? "#06B6D4" : "#ffffff" }}>
                {taskCount!.total}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#f9fafb" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 16,
          backgroundColor: isDark ? "#111827" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1f2937" : "#e5e7eb",
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
            borderRadius: 12,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={isDark ? "#06B6D4" : "#0891B2"} />
          <Text
            style={{
              color: isDark ? "#06B6D4" : "#0891B2",
              fontWeight: "600",
              marginLeft: 6,
              fontSize: 14,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        {/* Title */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#1f2937",
            marginBottom: 4,
          }}
        >
          Study Calendar
        </Text>
        <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
          Plan your SAT preparation journey
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SAT Date Notification */}
        {satDate ? (
          <View
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: "#f59e0b",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: "#f59e0b20",
                  marginRight: 12,
                }}
              >
                <CalendarIcon size={20} color="#f59e0b" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#1f2937",
                }}
              >
                Your SAT Date
              </Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#f59e0b",
                marginBottom: 8,
              }}
            >
              {new Date(satDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
                {Math.ceil((new Date(satDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/edit-profile" as any)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: isDark ? "#0f172a" : "#f9fafb",
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#06B6D4", fontWeight: "600", fontSize: 12 }}>
                  Change Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push("/edit-profile" as any)}
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: "#ef4444",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: "#ef444420",
                  marginRight: 12,
                }}
              >
                <AlertCircle size={20} color="#ef4444" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#1f2937",
                }}
              >
                Set Your SAT Date
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 8,
              }}
            >
              Tap here to set your SAT exam date and track your preparation progress
            </Text>
            <View
              style={{
                backgroundColor: isDark ? "#0f172a" : "#f9fafb",
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#06B6D4", fontWeight: "600", fontSize: 14 }}>
                Set Date Now
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Calendar */}
        <View
          style={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderRadius: 16,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Month Navigation */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={previousMonth}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: isDark ? "#0f172a" : "#f9fafb",
              }}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={isDark ? "#06B6D4" : "#0891B2"} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#1f2937",
              }}
            >
              {formatMonthYear(currentMonth)}
            </Text>

            <TouchableOpacity
              onPress={nextMonth}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: isDark ? "#0f172a" : "#f9fafb",
              }}
              activeOpacity={0.7}
            >
              <ChevronRight size={20} color={isDark ? "#06B6D4" : "#0891B2"} />
            </TouchableOpacity>
          </View>

          {/* Day Labels */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {dayNames.map((day, index) => (
              <View key={index} style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {generateCalendar()}
          </View>

          {/* Legend */}
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? "#334155" : "#e5e7eb" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-around", flexWrap: "wrap" }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#06B6D4", marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#6b7280" }}>Today</Text>
              </View>
              {satDate && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#f59e0b", marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#6b7280" }}>SAT Date</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#06B6D4", marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#6b7280" }}>Selected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Helper Text */}
        <View style={{ marginTop: 16, padding: 16, backgroundColor: isDark ? "#1e293b20" : "#06B6D410", borderRadius: 12 }}>
          <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280", textAlign: "center" }}>
            Tap any date to create a study plan for that day
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
