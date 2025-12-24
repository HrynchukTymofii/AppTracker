import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useBlocking } from "@/context/BlockingContext";
import { useTranslation } from "react-i18next";
import { ThemedBackground } from "@/components/ui/ThemedBackground";

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { schedules, refreshData } = useBlocking();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  // Get schedules for the selected day
  const dayOfWeek = selectedDate.getDay();
  const activeSchedules = schedules.filter(
    (schedule) => schedule.isActive && schedule.daysOfWeek.includes(dayOfWeek)
  );

  // Generate hours (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Navigate days
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isPastDay = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));

  // Format date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  // Get short weekday names
  const getWeekDays = () => {
    const days = [];
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - current.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
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
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {t("blocking.schedules") || "Schedules"}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/blocking?openSchedule=true")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#ffffff" : "#111827",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={22} color={isDark ? "#111827" : "#ffffff"} />
        </TouchableOpacity>
      </View>

      {/* Week Day Selector */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          marginBottom: 16,
          gap: 4,
        }}
      >
        {weekDays.map((day, index) => {
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const isTodayDay = day.toDateString() === new Date().toDateString();
          const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

          return (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedDate(day)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isSelected
                  ? isDark ? "#ffffff" : "#111827"
                  : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: isSelected
                    ? isDark ? "#111827" : "#ffffff"
                    : isDark ? "#6b7280" : "#9ca3af",
                  marginBottom: 6,
                }}
              >
                {dayNames[index]}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: isSelected ? "700" : "500",
                  color: isSelected
                    ? isDark ? "#111827" : "#ffffff"
                    : isTodayDay
                    ? "#3b82f6"
                    : isDark ? "#ffffff" : "#111827",
                }}
              >
                {day.getDate()}
              </Text>
              {isTodayDay && !isSelected && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#3b82f6",
                    marginTop: 4,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date Navigation */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          marginBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={goToPreviousDay}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color={isDark ? "#ffffff" : "#111827"} />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            {formatDate(selectedDate)}
          </Text>
          {!isToday && (
            <TouchableOpacity onPress={goToToday} style={{ marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: "#3b82f6",
                  fontWeight: "600",
                }}
              >
                Go to Today
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={goToNextDay}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={20} color={isDark ? "#ffffff" : "#111827"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Schedules for Day */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark ? "#6b7280" : "#9ca3af",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {activeSchedules.length} {isToday ? "Active Today" : "Scheduled"}
          </Text>

          {activeSchedules.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/blocking?openSchedule=true")}
              style={{
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#f9fafb",
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: isDark
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(59, 130, 246, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Plus size={28} color="#3b82f6" />
              </View>
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#111827",
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {t("home.createSchedule") || "Create a Schedule"}
              </Text>
              <Text
                style={{
                  color: isDark ? "#6b7280" : "#9ca3af",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {isPastDay
                  ? "No schedules were active"
                  : "Tap to add a blocking schedule"}
              </Text>
            </TouchableOpacity>
          ) : (
            activeSchedules.map((schedule, index) => {
              const colors = [
                "#3b82f6",
                "#8b5cf6",
                "#ec4899",
                "#f59e0b",
                "#10b981",
              ];
              const color = colors[index % colors.length];

              return (
                <TouchableOpacity
                  key={schedule.id}
                  onPress={() => router.push(`/(tabs)/blocking?editSchedule=${schedule.id}`)}
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#f9fafb",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 10,
                    borderLeftWidth: 4,
                    borderLeftColor: isPastDay ? (isDark ? "#6b7280" : "#9ca3af") : color,
                    opacity: isPastDay ? 0.6 : 1,
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: isDark ? "#ffffff" : "#111827",
                          marginBottom: 4,
                        }}
                      >
                        {schedule.name}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Clock size={14} color={isDark ? "#6b7280" : "#9ca3af"} />
                          <Text
                            style={{
                              fontSize: 13,
                              color: isDark ? "#9ca3af" : "#6b7280",
                            }}
                          >
                            {schedule.startTime} - {schedule.endTime}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            color: color,
                            fontWeight: "500",
                          }}
                        >
                          {schedule.apps.length} apps
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={isDark ? "#6b7280" : "#9ca3af"} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Timeline View */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark ? "#6b7280" : "#9ca3af",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Timeline
          </Text>

          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#fafafa",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
              padding: 12,
            }}
          >
            <ScrollView
              style={{ height: 400 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={{ flexDirection: "row", height: hours.length * 60 }}>
                {/* Time labels column */}
                <View style={{ width: 50, paddingTop: 5 }}>
                  {hours.map((hour) => (
                    <View
                      key={hour}
                      style={{
                        height: 60,
                        justifyContent: "flex-start",
                        paddingRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: isDark ? "#6b7280" : "#9ca3af",
                          fontWeight: "500",
                          textAlign: "right",
                        }}
                      >
                        {hour % 12 === 0 ? 12 : hour % 12}
                        {hour < 12 ? "a" : "p"}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Events column */}
                <View
                  style={{
                    flex: 1,
                    position: "relative",
                    height: hours.length * 60,
                  }}
                >
                  {/* Hour lines */}
                  {hours.map((hour, index) => (
                    <View
                      key={hour}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: index * 60,
                        height: 1,
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.05)",
                      }}
                    />
                  ))}

                  {/* Current time indicator */}
                  {isToday &&
                    (() => {
                      const now = new Date();
                      const currentHour = now.getHours();
                      const currentMinute = now.getMinutes();
                      if (currentHour >= 6 && currentHour < 24) {
                        const position = (currentHour - 6) * 60 + currentMinute;
                        return (
                          <>
                            <View
                              style={{
                                position: "absolute",
                                left: -8,
                                top: position - 4,
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#ef4444",
                                zIndex: 11,
                              }}
                            />
                            <View
                              style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: position,
                                height: 2,
                                backgroundColor: "#ef4444",
                                zIndex: 10,
                              }}
                            />
                          </>
                        );
                      }
                      return null;
                    })()}

                  {/* Schedule blocks */}
                  {activeSchedules.map((schedule, index) => {
                    const [startHour, startMin] = schedule.startTime
                      .split(":")
                      .map(Number);
                    const [endHour, endMin] = schedule.endTime
                      .split(":")
                      .map(Number);

                    const topPosition = (startHour - 6) * 60 + startMin;
                    const height = (endHour - 6) * 60 + endMin - topPosition;

                    const colors = [
                      "#3b82f6",
                      "#8b5cf6",
                      "#ec4899",
                      "#f59e0b",
                      "#10b981",
                    ];
                    const color = isPastDay ? (isDark ? "#6b7280" : "#9ca3af") : colors[index % colors.length];

                    return (
                      <View
                        key={schedule.id}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: topPosition,
                          height: Math.max(height, 30),
                          right: 10,
                          backgroundColor: isPastDay
                            ? (isDark ? "rgba(107, 114, 128, 0.2)" : "rgba(156, 163, 175, 0.2)")
                            : `${color}33`,
                          borderLeftWidth: 4,
                          borderLeftColor: color,
                          borderRadius: 8,
                          padding: 8,
                          justifyContent: "flex-start",
                          opacity: isPastDay ? 0.6 : 1,
                        }}
                      >
                        <Text
                          numberOfLines={height > 40 ? 2 : 1}
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: isPastDay
                              ? (isDark ? "#9ca3af" : "#6b7280")
                              : (isDark ? "#ffffff" : "#111827"),
                          }}
                        >
                          {schedule.name}
                        </Text>
                        {height > 40 && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: isPastDay
                                ? (isDark ? "#6b7280" : "#9ca3af")
                                : (isDark ? "#e5e7eb" : "#374151"),
                              marginTop: 2,
                            }}
                          >
                            {schedule.startTime} - {schedule.endTime}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}
