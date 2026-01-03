import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, TrendingUp, ChevronRight } from "lucide-react-native";
import { useEarnedTime } from "@/context/EarnedTimeContext";
import { ExerciseType } from "@/lib/poseUtils";

interface EarnTimeSectionProps {
  isDark: boolean;
  onStartExercise: (type: ExerciseType) => void;
  onVerifiedStart: () => void;
}

export const EarnTimeSection: React.FC<EarnTimeSectionProps> = ({
  isDark,
  onStartExercise,
  onVerifiedStart,
}) => {
  const { wallet, getTodayEarned, getTodaySpent, getWeekStats } = useEarnedTime();

  const todayEarned = getTodayEarned();
  const todaySpent = getTodaySpent();
  const weekStats = getWeekStats();

  const exercises: { type: ExerciseType; emoji: string; label: string; description: string; iconColors: [string, string] }[] = [
    { type: "pushups", emoji: "💪", label: "Push-ups", description: "0.5 min per rep", iconColors: ["#ef4444", "#dc2626"] },
    { type: "squats", emoji: "🏋️", label: "Squats", description: "0.4 min per rep", iconColors: ["#8b5cf6", "#7c3aed"] },
    { type: "plank", emoji: "🧘", label: "Plank", description: "0.1 min per second", iconColors: ["#10b981", "#059669"] },
  ];

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
      {/* Balance Card */}
      <View
        style={{
          backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.15 : 0.06,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Available Balance */}
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#6b7280" : "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Available
            </Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: "#3b82f6",
                marginTop: 4,
              }}
            >
              {wallet.availableMinutes.toFixed(1)}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#6b7280" : "#9ca3af",
                fontWeight: "500",
              }}
            >
              minutes
            </Text>
          </View>

          {/* Divider */}
          <View
            style={{
              width: 1,
              height: 60,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            }}
          />

          {/* Today Stats */}
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#6b7280" : "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Today
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#10b981",
                }}
              >
                +{todayEarned.toFixed(1)}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: isDark ? "#6b7280" : "#9ca3af",
                  marginHorizontal: 4,
                }}
              >
                /
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#ef4444",
                }}
              >
                -{todaySpent.toFixed(1)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#6b7280" : "#9ca3af",
                fontWeight: "500",
              }}
            >
              earned / spent
            </Text>
          </View>
        </View>

        {/* Week Stats Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TrendingUp size={16} color="#10b981" />
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#9ca3af" : "#6b7280",
                marginLeft: 6,
              }}
            >
              This week:{" "}
              <Text style={{ color: "#10b981", fontWeight: "600" }}>
                +{weekStats.earned.toFixed(0)} min
              </Text>{" "}
              earned
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            <Text style={{ color: "#ef4444", fontWeight: "600" }}>
              -{weekStats.spent.toFixed(0)} min
            </Text>{" "}
            spent
          </Text>
        </View>
      </View>

      {/* Photo Task Button */}
      <TouchableOpacity
        onPress={onVerifiedStart}
        activeOpacity={0.7}
        style={{
          backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "rgba(59, 130, 246, 0.3)",
          shadowColor: "#3b82f6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <Camera size={24} color="#ffffff" strokeWidth={2} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#0f172a",
              letterSpacing: -0.3,
            }}
          >
            Photo Task
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
              marginTop: 2,
            }}
          >
            Verify your focus with before/after photos
          </Text>
        </View>

        <ChevronRight size={20} color="#3b82f6" strokeWidth={2} />
      </TouchableOpacity>

      {/* Exercises Header */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: isDark ? "#ffffff" : "#111827",
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        Earn with Exercise
      </Text>

      {/* Exercise Buttons */}
      {exercises.map((exercise) => (
        <TouchableOpacity
          key={exercise.type}
          onPress={() => onStartExercise(exercise.type)}
          activeOpacity={0.7}
          style={{
            backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "rgba(16, 185, 129, 0.3)",
            shadowColor: "#10b981",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={exercise.iconColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <Text style={{ fontSize: 24 }}>{exercise.emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: -0.3,
              }}
            >
              {exercise.label}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
                marginTop: 2,
              }}
            >
              {exercise.description}
            </Text>
          </View>

          <ChevronRight size={20} color="#10b981" strokeWidth={2} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default EarnTimeSection;
