import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, TrendingUp, ChevronRight, Star } from "lucide-react-native";
import { useEarnedTime } from "@/context/EarnedTimeContext";
import { ExerciseType } from "@/lib/poseUtils";
import { getFavorites, toggleFavorite, MAX_EXERCISE_FAVORITES } from "@/lib/exerciseFavorites";
import { EXERCISE_DISPLAY_INFO, ExerciseDisplayInfo } from "@/lib/exerciseIcons";
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
  const renderExerciseCard = (exercise: ExerciseDisplayInfo, isFavorite: boolean) => (
    <TouchableOpacity
      key={exercise.type}
      onPress={() => handleExercisePress(exercise.type)}
      activeOpacity={0.7}
      style={{
        backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isFavorite ? "rgba(251, 191, 36, 0.4)" : "rgba(16, 185, 129, 0.3)",
        shadowColor: isFavorite ? "#fbbf24" : "#10b981",
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
          colors={exercise.colors}
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
        {exercise.image ? (
          <Image
            source={exercise.image}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: 24 }}>{exercise.emoji}</Text>
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
    </TouchableOpacity>
  );

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
            {t("lockin.photoTask")}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
              marginTop: 2,
            }}
          >
            {t("lockin.photoTaskDesc")}
          </Text>
        </View>

        <ChevronRight size={20} color="#3b82f6" strokeWidth={2} />
      </TouchableOpacity>

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
