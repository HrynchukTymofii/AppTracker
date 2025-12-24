import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  BookOpen,
  Dumbbell,
  Briefcase,
  Palette,
  Book,
  Target,
  RefreshCw,
  Clock,
  Camera,
  Bell,
} from "lucide-react-native";
import { LockInTask, TaskCategory } from "@/context/LockInContext";

interface TaskCardProps {
  task: LockInTask;
  isDark: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

const getCategoryIcon = (category: TaskCategory) => {
  switch (category) {
    case "study":
      return BookOpen;
    case "health":
      return Dumbbell;
    case "work":
      return Briefcase;
    case "creative":
      return Palette;
    case "reading":
      return Book;
    default:
      return Target;
  }
};

const getCategoryColor = (category: TaskCategory) => {
  switch (category) {
    case "study":
      return "#3b82f6";
    case "health":
      return "#10b981";
    case "work":
      return "#f59e0b";
    case "creative":
      return "#ec4899";
    case "reading":
      return "#8b5cf6";
    default:
      return "#6b7280";
  }
};

const getCategoryName = (category: TaskCategory) => {
  switch (category) {
    case "study":
      return "Study";
    case "health":
      return "Health";
    case "work":
      return "Work";
    case "creative":
      return "Creative";
    case "reading":
      return "Reading";
    default:
      return "Custom";
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const getDaysLabel = (days?: number[]): string => {
  if (!days || days.length === 0) return "";
  if (days.length === 7) return "Daily";
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Weekdays";
  if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends";

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((d) => dayNames[d]).join(", ");
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, isDark, onPress, onLongPress }) => {
  const Icon = getCategoryIcon(task.category);
  const color = getCategoryColor(task.category);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Category icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isDark ? `${color}15` : `${color}10`,
            marginRight: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} color={color} />
        </View>

        {/* Task info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: 6,
            }}
            numberOfLines={1}
          >
            {task.name}
          </Text>

          {/* Tags row */}
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            {/* Scheduled time tag */}
            {task.scheduledTime && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Bell size={11} color="#3b82f6" />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#3b82f6",
                    marginLeft: 4,
                  }}
                >
                  {task.scheduledTime}
                </Text>
              </View>
            )}

            {/* Duration tag */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Clock size={11} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginLeft: 4,
                }}
              >
                {formatDuration(task.durationMinutes)}
              </Text>
            </View>

            {/* Repeat tag */}
            {task.isRepeating && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <RefreshCw size={11} color={isDark ? "#9ca3af" : "#6b7280"} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginLeft: 4,
                  }}
                >
                  {getDaysLabel(task.repeatDays)}
                </Text>
              </View>
            )}

            {/* Photo verification tag */}
            {task.requiresPhotoVerification && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.08)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Camera size={11} color="#10b981" />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: "#10b981",
                    marginLeft: 4,
                  }}
                >
                  Verified
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TaskCard;
