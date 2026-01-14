import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Camera, TrendingUp, ChevronRight, Star } from "lucide-react-native";
import { useEarnedTime } from "@/context/EarnedTimeContext";
import { ExerciseType } from "@/lib/poseUtils";
import { getFavorites, toggleFavorite, MAX_EXERCISE_FAVORITES } from "@/lib/exerciseFavorites";
import { EXERCISE_DISPLAY_INFO, ExerciseDisplayInfo, getExerciseIcon } from "@/lib/exerciseIcons";
import { useTranslation } from "react-i18next";

// Map exercise type (kebab-case) to translation key (camelCase)
const exerciseTypeToTranslationKey: Record<ExerciseType, string> = {
  'pushups': 'pushups',
  'squats': 'squats',
  'plank': 'plank',
  'jumping-jacks': 'jumpingJacks',
  'lunges': 'lunges',
  'crunches': 'crunches',
  'shoulder-press': 'shoulderPress',
  'leg-raises': 'legRaises',
  'high-knees': 'highKnees',
  'pull-ups': 'pullUps',
  'wall-sit': 'wallSit',
  'side-plank': 'sidePlank',
};

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
  const { t } = useTranslation();
  const { wallet, getTodayEarned, getTodaySpent, getWeekStats } = useEarnedTime();
  const [favorites, setFavorites] = useState<ExerciseType[]>([]);
  const lastTapRef = useRef<{ type: ExerciseType | null; time: number }>({ type: null, time: 0 });

  const todayEarned = getTodayEarned();
  const todaySpent = getTodaySpent();
  const weekStats = getWeekStats();

  // Load favorites on mount
  useEffect(() => {
    getFavorites().then(setFavorites);
  }, []);

  // Handle exercise press with double-tap detection
  const handleExercisePress = async (type: ExerciseType) => {
    const now = Date.now();
    const lastTap = lastTapRef.current;

    if (lastTap.type === type && now - lastTap.time < 300) {
      // Double tap - toggle favorite
      const result = await toggleFavorite(type);
      setFavorites(result.favorites);
      lastTapRef.current = { type: null, time: 0 };
    } else {
      // Single tap - start exercise after delay to check for double tap
      lastTapRef.current = { type, time: now };
      setTimeout(() => {
        if (lastTapRef.current.type === type && Date.now() - lastTapRef.current.time >= 280) {
          onStartExercise(type);
          lastTapRef.current = { type: null, time: 0 };
        }
      }, 300);
    }
  };

  // Split exercises into favorites and non-favorites
  const favoriteExercises = EXERCISE_DISPLAY_INFO.filter(e => favorites.includes(e.type));
  const otherExercises = EXERCISE_DISPLAY_INFO.filter(e => !favorites.includes(e.type));

  // Render exercise card
  const renderExerciseCard = (exercise: ExerciseDisplayInfo, isFavorite: boolean) => {
    const iconInfo = getExerciseIcon(exercise.type);
    const glowColor = isFavorite ? "#fbbf24" : "#10b981";
    return (
    <TouchableOpacity
      key={exercise.type}
      onPress={() => handleExercisePress(exercise.type)}
      activeOpacity={0.7}
      style={{
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isFavorite
          ? (isDark ? "rgba(251, 191, 36, 0.4)" : "rgba(251, 191, 36, 0.3)")
          : (isDark ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.3)"),
      }}
    >
      <BlurView
        intensity={isDark ? 20 : 35}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={
          isDark
            ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"]
            : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top shine */}
      <LinearGradient
        colors={isDark ? ["rgba(255, 255, 255, 0.06)", "transparent"] : ["rgba(255, 255, 255, 0.4)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { height: "60%" }]}
      />
      {/* Glow */}
      <LinearGradient
        colors={[`${glowColor}15`, "transparent"]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
            overflow: "hidden",
            borderWidth: iconInfo.image ? 2 : 0,
            borderColor: exercise.colors[0],
          }}
        >
          {iconInfo.image ? (
            <Image
              source={iconInfo.image}
              style={{ width: "100%", height: "100%", borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : (
            <>
              <LinearGradient
                colors={exercise.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={{ fontSize: 24 }}>{iconInfo.emoji}</Text>
            </>
          )}
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
            {t(`exercise.${exerciseTypeToTranslationKey[exercise.type]}.name`)}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
              marginTop: 2,
            }}
          >
            {t(`exercise.${exerciseTypeToTranslationKey[exercise.type]}.description`)}
          </Text>
        </View>

        {isFavorite && (
          <Star size={16} color="#fbbf24" fill="#fbbf24" style={{ marginRight: 8 }} />
        )}
        <ChevronRight size={20} color={isFavorite ? "#fbbf24" : "#10b981"} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
  };

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
      {/* Balance Card */}
      <View
        style={{
          borderRadius: 20,
          marginBottom: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
        }}
      >
        <BlurView
          intensity={isDark ? 25 : 40}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"]
              : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Top shine */}
        <LinearGradient
          colors={isDark ? ["rgba(255, 255, 255, 0.08)", "transparent"] : ["rgba(255, 255, 255, 0.5)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { height: "50%" }]}
        />
        <View style={{ padding: 20 }}>
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
              {t("lockin.available")}
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
              {t("lockin.minutes")}
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
              {t("lockin.today")}
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
              {t("lockin.earnedSpent")}
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
              {t("lockin.thisWeek")}{" "}
              <Text style={{ color: "#10b981", fontWeight: "600" }}>
                +{weekStats.earned.toFixed(0)} {t("lockin.min")}
              </Text>{" "}
              {t("lockin.earned")}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            <Text style={{ color: "#ef4444", fontWeight: "600" }}>
              -{weekStats.spent.toFixed(0)} {t("lockin.min")}
            </Text>{" "}
            {t("lockin.spent")}
          </Text>
        </View>
        </View>
      </View>

      {/* Photo Task Button - Coming Soon */}
      <View
        style={{
          borderRadius: 16,
          marginBottom: 12,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark ? "rgba(107, 114, 128, 0.3)" : "rgba(107, 114, 128, 0.2)",
          opacity: 0.6,
        }}
      >
        <BlurView
          intensity={isDark ? 20 : 35}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(255, 255, 255, 0.04)", "rgba(255, 255, 255, 0.01)"]
              : ["rgba(255, 255, 255, 0.7)", "rgba(255, 255, 255, 0.5)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              overflow: "hidden",
              backgroundColor: isDark ? "rgba(107, 114, 128, 0.3)" : "rgba(107, 114, 128, 0.2)",
            }}
          >
            <Camera size={24} color={isDark ? "#6b7280" : "#9ca3af"} strokeWidth={2} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: isDark ? "#6b7280" : "#9ca3af",
                  letterSpacing: -0.3,
                }}
              >
                {t("lockin.photoTask")}
              </Text>
              {/* Coming Soon Badge */}
              <View
                style={{
                  backgroundColor: isDark ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.15)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  marginLeft: 8,
                  borderWidth: 1,
                  borderColor: "rgba(251, 191, 36, 0.3)",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#f59e0b",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Coming Soon
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "rgba(255,255,255,0.35)" : "#b0b8c4",
                marginTop: 2,
              }}
            >
              {t("lockin.photoTaskDesc")}
            </Text>
          </View>
        </View>
      </View>

      {/* Favorites Section */}
      {favoriteExercises.length > 0 && (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 12 }}>
            <Star size={16} color="#fbbf24" fill="#fbbf24" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#111827",
                marginLeft: 8,
              }}
            >
              {t("lockin.favorites")}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#6b7280" : "#9ca3af",
                marginLeft: 8,
              }}
            >
              {t("lockin.doubleTapRemove")}
            </Text>
          </View>
          {favoriteExercises.map((exercise) => renderExerciseCard(exercise, true))}
        </>
      )}

      {/* All Exercises Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: favoriteExercises.length > 0 ? 8 : 8, marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {favoriteExercises.length > 0 ? t("lockin.allExercises") : t("lockin.earnWithExercise")}
        </Text>
        {favoriteExercises.length < MAX_EXERCISE_FAVORITES && (
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#6b7280" : "#9ca3af",
              marginLeft: 8,
            }}
          >
            {t("lockin.doubleTapFavorite")}
          </Text>
        )}
      </View>

      {/* Exercise Buttons */}
      {otherExercises.map((exercise) => renderExerciseCard(exercise, false))}
    </View>
  );
};

export default EarnTimeSection;
