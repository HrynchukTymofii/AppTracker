import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Calendar, Clock, Camera, ChevronRight, Plus } from "lucide-react-native";
import { ScheduledLockIn } from "@/context/LockInContext";

interface ScheduledLockInsProps {
  scheduled: ScheduledLockIn[];
  isDark: boolean;
  onSeeAll: () => void;
  onAddScheduled: () => void;
  onScheduledPress: (scheduled: ScheduledLockIn) => void;
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const getDayLabel = (scheduled: ScheduledLockIn): string => {
  if (scheduled.scheduledDate) {
    const date = new Date(scheduled.scheduledDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  if (scheduled.repeatDays && scheduled.repeatDays.length > 0) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date().getDay();

    // Find the next day
    for (let i = 0; i < 7; i++) {
      const checkDay = (today + i) % 7;
      if (scheduled.repeatDays.includes(checkDay)) {
        if (i === 0) return "Today";
        if (i === 1) return "Tomorrow";
        return dayNames[checkDay];
      }
    }
  }

  return "Scheduled";
};

export const ScheduledLockIns: React.FC<ScheduledLockInsProps> = ({
  scheduled,
  isDark,
  onSeeAll,
  onAddScheduled,
  onScheduledPress,
}) => {
  // Only show first 3
  const displayScheduled = scheduled.slice(0, 3);

  return (
    <View style={{ marginTop: 24, paddingBottom: 120 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          Scheduled LockIns
        </Text>
        {scheduled.length > 3 && (
          <TouchableOpacity
            onPress={onSeeAll}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#3b82f6",
                marginRight: 4,
              }}
            >
              See All
            </Text>
            <ChevronRight size={16} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal scroll of scheduled items */}
      {displayScheduled.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        >
          {displayScheduled.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onScheduledPress(item)}
              activeOpacity={0.7}
              style={{
                width: 140,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Day label */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#3b82f6",
                  marginBottom: 4,
                }}
              >
                {getDayLabel(item)}
              </Text>

              {/* Time */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Clock size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#111827",
                    marginLeft: 6,
                  }}
                >
                  {item.scheduledTime}
                </Text>
              </View>

              {/* Task name */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: isDark ? "#ffffff" : "#111827",
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {item.taskName}
              </Text>

              {/* Duration & photo indicator */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {formatDuration(item.durationMinutes)}
                </Text>
                {item.requiresPhotoVerification && (
                  <Camera size={12} color="#10b981" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Add new scheduled card */}
          <TouchableOpacity
            onPress={onAddScheduled}
            activeOpacity={0.7}
            style={{
              width: 100,
              backgroundColor: isDark
                ? "rgba(59, 130, 246, 0.08)"
                : "rgba(59, 130, 246, 0.05)",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1.5,
              borderColor: "#3b82f6",
              borderStyle: "dashed",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#3b82f6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Plus size={20} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#3b82f6",
                textAlign: "center",
              }}
            >
              Schedule
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={onAddScheduled}
            activeOpacity={0.8}
            style={{
              backgroundColor: isDark
                ? "rgba(59, 130, 246, 0.08)"
                : "rgba(59, 130, 246, 0.05)",
              borderRadius: 14,
              padding: 20,
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: "#3b82f6",
              borderStyle: "dashed",
            }}
          >
            <Calendar size={32} color="#3b82f6" style={{ marginBottom: 12 }} />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: "#3b82f6",
                marginBottom: 4,
              }}
            >
              Schedule a LockIn
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#9ca3af" : "#6b7280",
                textAlign: "center",
              }}
            >
              Plan your focus sessions in advance
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ScheduledLockIns;
